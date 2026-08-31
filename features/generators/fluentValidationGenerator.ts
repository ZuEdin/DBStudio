import { Table, FieldType } from '../../types';
import { GeneratedCsFile } from './efCoreGenerator';

export interface FluentValidationGeneratorOptions {
  namespace?: string;
  usePascalCase?: boolean;
}

export class FluentValidationGenerator {
  /**
   * Generates FluentValidation Validator classes for all database tables
   */
  public static generateValidators(
    tables: Table[],
    namespace: string = 'EnterpriseStudio.Data'
  ): GeneratedCsFile[] {
    const validators: GeneratedCsFile[] = tables.map((table) => {
      const entityName = this.toPascalCase(table.name.replace(/^tbl_/, ''));
      const code = this.generateValidatorForTable(table, entityName, namespace);
      return {
        fileName: `${entityName}Validator.cs`,
        description: `FluentValidation Validator für ${entityName}`,
        code,
        category: 'entity',
      };
    });

    // Generate Dependency Injection Extension method
    const diCode = this.generateDiRegistration(tables, namespace);
    validators.push({
      fileName: `FluentValidationExtensions.cs`,
      description: `Dependency Injection ServiceCollection Extension für FluentValidation`,
      code: diCode,
      category: 'entity',
    });

    return validators;
  }

  private static generateValidatorForTable(
    table: Table,
    entityName: string,
    namespace: string
  ): string {
    let rules = '';

    const hasStartDate = table.fields.some((f) => f.name.toLowerCase().includes('startdate') || f.name.toLowerCase().includes('start_date') || f.name.toLowerCase().includes('gueltig_ab'));
    const hasEndDate = table.fields.some((f) => f.name.toLowerCase().includes('enddate') || f.name.toLowerCase().includes('end_date') || f.name.toLowerCase().includes('gueltig_bis'));
    const hasQty = table.fields.some((f) => f.name.toLowerCase() === 'quantity' || f.name.toLowerCase() === 'menge');
    const hasUnitPrice = table.fields.some((f) => f.name.toLowerCase() === 'unitprice' || f.name.toLowerCase() === 'einzelpreis' || f.name.toLowerCase() === 'price');
    const hasTotalPrice = table.fields.some((f) => f.name.toLowerCase() === 'totalprice' || f.name.toLowerCase() === 'gesamtpreis' || f.name.toLowerCase() === 'total');

    for (const field of table.fields) {
      const propName = this.toPascalCase(field.name);
      const isPk = field.isPrimaryKey || field.name.toLowerCase() === 'id';
      const isRequired = field.allowNull === false || field.isNullable === false || isPk;
      const type = String(field.type).toUpperCase();

      if (isPk) continue; // Primary keys are typically DB generated

      const fieldRules: string[] = [];

      // Required / NotNull check
      if (isRequired) {
        if (this.isStringType(type)) {
          fieldRules.push(`NotEmpty().WithMessage("${field.name} darf nicht leer sein.")`);
        } else {
          fieldRules.push(`NotNull().WithMessage("${field.name} ist ein Pflichtfeld.")`);
        }
      }

      // MaxLength for strings
      if (field.length && this.isStringType(type)) {
        fieldRules.push(`MaximumLength(${field.length}).WithMessage("${field.name} darf maximal ${field.length} Zeichen lang sein.")`);
      }

      // Specific formatting validations
      if (type === 'EMAIL' || field.name.toLowerCase().includes('email') || field.name.toLowerCase().includes('e_mail')) {
        fieldRules.push(`EmailAddress().WithMessage("Ungültiges E-Mail-Format.")`);
      } else if (type === 'PHONE' || field.name.toLowerCase().includes('phone') || field.name.toLowerCase().includes('telefon')) {
        fieldRules.push(`Matches(@"^\\+?[0-9\\s\\-()]{6,30}$").When(x => !string.IsNullOrEmpty(x.${propName})).WithMessage("Ungültige Telefonnummer.")`);
      } else if (type === 'URL' || field.name.toLowerCase().includes('url') || field.name.toLowerCase().includes('website')) {
        fieldRules.push(`Must(uri => string.IsNullOrEmpty(uri) || Uri.TryCreate(uri, UriKind.Absolute, out _)).WithMessage("Ungültige Webadresse (URL).")`);
      } else if (type === 'IBAN' || field.name.toLowerCase().includes('iban')) {
        fieldRules.push(`Matches(@"^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$").When(x => !string.IsNullOrEmpty(x.${propName})).WithMessage("Ungültige IBAN-Struktur.")`);
      }

      // Numeric validations
      if (this.isCurrencyOrPrice(type, field.name)) {
        fieldRules.push(`GreaterThanOrEqualTo(0).WithMessage("${field.name} darf nicht negativ sein.")`);
        fieldRules.push(`PrecisionScale(18, 2, ignoreTrailingZeros: true).WithMessage("${field.name} darf maximal 2 Nachkommastellen haben.")`);
      } else if (type === 'PERCENTAGE' || field.name.toLowerCase().includes('prozent') || field.name.toLowerCase().includes('percent')) {
        fieldRules.push(`InclusiveBetween(0, 100).WithMessage("${field.name} muss zwischen 0 und 100 Prozent liegen.")`);
      } else if (field.name.toLowerCase() === 'quantity' || field.name.toLowerCase() === 'menge') {
        fieldRules.push(`GreaterThan(0).WithMessage("Die Menge muss größer als 0 sein.")`);
      }

      if (fieldRules.length > 0) {
        rules += `        RuleFor(x => x.${propName})\n`;
        rules += fieldRules.map((r) => `            .${r}`).join('\n') + ';\n\n';
      }
    }

    // Cross-field logic: StartDate vs EndDate
    if (hasStartDate && hasEndDate) {
      const startField = table.fields.find((f) => f.name.toLowerCase().includes('startdate') || f.name.toLowerCase().includes('start_date') || f.name.toLowerCase().includes('gueltig_ab'))!;
      const endField = table.fields.find((f) => f.name.toLowerCase().includes('enddate') || f.name.toLowerCase().includes('end_date') || f.name.toLowerCase().includes('gueltig_bis'))!;
      const startProp = this.toPascalCase(startField.name);
      const endProp = this.toPascalCase(endField.name);

      rules += `        // Datumsbereichsvalidierung\n`;
      rules += `        RuleFor(x => x.${endProp})\n`;
      rules += `            .GreaterThanOrEqualTo(x => x.${startProp})\n`;
      rules += `            .WithMessage("${endField.name} darf nicht vor ${startField.name} liegen.");\n\n`;
    }

    // Cross-field logic: Quantity * UnitPrice == TotalPrice
    if (hasQty && hasUnitPrice && hasTotalPrice) {
      const qtyProp = this.toPascalCase(table.fields.find((f) => f.name.toLowerCase() === 'quantity' || f.name.toLowerCase() === 'menge')!.name);
      const upProp = this.toPascalCase(table.fields.find((f) => f.name.toLowerCase() === 'unitprice' || f.name.toLowerCase() === 'einzelpreis' || f.name.toLowerCase() === 'price')!.name);
      const totalProp = this.toPascalCase(table.fields.find((f) => f.name.toLowerCase() === 'totalprice' || f.name.toLowerCase() === 'gesamtpreis' || f.name.toLowerCase() === 'total')!.name);

      rules += `        // Konsistenzprüfung: Gesamtbetrag = Menge * Einzelpreis\n`;
      rules += `        RuleFor(x => x.${totalProp})\n`;
      rules += `            .Equal(x => Math.Round(x.${qtyProp} * x.${upProp}, 2))\n`;
      rules += `            .When(x => x.${upProp} > 0)\n`;
      rules += `            .WithMessage("Gesamtpreis (${totalProp}) stimmt nicht mit Menge x Einzelpreis überein.");\n\n`;
    }

    return `// <auto-generated>
//    Erstellt von DB Studio Pro - FluentValidation Generator für C# .NET 10
// </auto-generated>

#nullable enable

using FluentValidation;
using ${namespace}.Entities;

namespace ${namespace}.Validators;

/// <summary>
/// FluentValidation Regelwerk für Domain-Entity: ${entityName}
/// </summary>
public class ${entityName}Validator : AbstractValidator<${entityName}>
{
    public ${entityName}Validator()
    {
${rules || '        // Keine spezifischen Validierungsregeln definiert\n'}    }
}
`;
  }

  private static generateDiRegistration(tables: Table[], namespace: string): string {
    const registrations = tables
      .map((table) => {
        const entityName = this.toPascalCase(table.name.replace(/^tbl_/, ''));
        return `        services.AddScoped<IValidator<${entityName}>, ${entityName}Validator>();`;
      })
      .join('\n');

    return `// <auto-generated>
//    Erstellt von DB Studio Pro - FluentValidation DI Extension
// </auto-generated>

#nullable enable

using Microsoft.Extensions.DependencyInjection;
using FluentValidation;
using ${namespace}.Entities;
using ${namespace}.Validators;

namespace ${namespace};

public static class FluentValidationServiceExtensions
{
    /// <summary>
    /// Registriert alle generierten FluentValidation Validatoren im ASP.NET Core DI-Container
    /// </summary>
    public static IServiceCollection AddEntityValidators(this IServiceCollection services)
    {
${registrations}
        return services;
    }
}
`;
  }

  private static isStringType(type: string): boolean {
    return ['VARCHAR', 'CHAR', 'TEXT', 'EMAIL', 'PHONE', 'URL', 'IBAN', 'BIC', 'JSON', 'COLOR_HEX', 'UNIT_MEASURE', 'ORDNUNGSZAHL', 'ENUM', 'STRING'].includes(type);
  }

  private static isCurrencyOrPrice(type: string, fieldName: string): boolean {
    const fn = fieldName.toLowerCase();
    return (
      type === 'CURRENCY' ||
      type === 'DECIMAL' ||
      fn.includes('preis') ||
      fn.includes('price') ||
      fn.includes('cost') ||
      fn.includes('betrag') ||
      fn.includes('amount') ||
      fn.includes('netto') ||
      fn.includes('brutto')
    );
  }

  private static toPascalCase(str: string): string {
    if (!str) return 'Entity';
    return str
      .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
      .replace(/^[a-z]/, (c) => c.toUpperCase());
  }
}
