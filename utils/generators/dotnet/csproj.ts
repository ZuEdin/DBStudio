
import { BackendConfig, DbType, VirtualFile } from '../../../types/index';

export const generateCsproj = (config: BackendConfig, root: string): VirtualFile => {
  let dbPackage = '';
  if (config.dbType === DbType.MySQL) {
      dbPackage = `<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.0" />`;
  } else if (config.dbType === DbType.SQLite) {
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="9.0.0" />`;
  } else {
      // Default to SQL Server
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="9.0.0" />`;
  }

  const content = `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="9.0.10" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="9.0.0" />
    ${dbPackage}
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
  </ItemGroup>

</Project>`;

  return { 
    name: `${config.projectName}.csproj`, 
    path: `${root}/${config.projectName}.csproj`, 
    content: content, 
    language: 'xml' 
  };
};
