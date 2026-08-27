import { Table, VirtualFile } from '../../../types/index';
import { toPascalCase, resolveType, isNullable } from '../common';

export const generateBlazorModels = (
  tables: Table[],
  namespace: string,
  root: string,
  useAuth: boolean = false
): VirtualFile[] => {
  const files: VirtualFile[] = [];

  // Data Models for each table
  tables.forEach(table => {
    const className = toPascalCase(table.name);
    const props = table.fields.map(f => {
      const propName = toPascalCase(f.name);
      const csharpType = resolveType(f, 'csharp');
      const nullable = isNullable(f) ? '?' : '';
      return `        public ${csharpType}${nullable} ${propName} { get; set; }`;
    }).join('\n');

    const content = `using System;
using System.Text.Json.Serialization;

namespace ${namespace}.Models
{
    public class ${className}
    {
${props}
    }
}
`;
    files.push({
      name: `${className}.cs`,
      path: `${root}/Models/${className}.cs`,
      content,
      language: 'csharp'
    });
  });

  // Auth Models
  if (useAuth) {
    const loginModel = `using System.ComponentModel.DataAnnotations;

namespace ${namespace}.Models
{
    public class LoginModel
    {
        [Required(ErrorMessage = "Benutzername ist erforderlich.")]
        public string Username { get; set; } = "";

        [Required(ErrorMessage = "Passwort ist erforderlich.")]
        public string Password { get; set; } = "";
    }

    public class RegisterModel
    {
        [Required(ErrorMessage = "Benutzername ist erforderlich.")]
        public string Username { get; set; } = "";

        [Required(ErrorMessage = "E-Mail ist erforderlich.")]
        [EmailAddress(ErrorMessage = "Ungültige E-Mail-Adresse.")]
        public string Email { get; set; } = "";

        [Required(ErrorMessage = "Passwort ist erforderlich.")]
        [MinLength(6, ErrorMessage = "Mindestens 6 Zeichen.")]
        public string Password { get; set; } = "";
    }

    public class ChangePasswordModel
    {
        [Required(ErrorMessage = "Altes Passwort erforderlich.")]
        public string OldPassword { get; set; } = "";

        [Required(ErrorMessage = "Neues Passwort erforderlich.")]
        [MinLength(6, ErrorMessage = "Mindestens 6 Zeichen.")]
        public string NewPassword { get; set; } = "";
    }

    public class AuthResponse
    {
        public string Token { get; set; } = "";
        public string? Username { get; set; }
        public string? Role { get; set; }
    }
}
`;
    files.push({
      name: 'AuthModels.cs',
      path: `${root}/Models/AuthModels.cs`,
      content: loginModel,
      language: 'csharp'
    });
  }

  return files;
};
