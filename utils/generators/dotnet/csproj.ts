
import { BackendConfig, DbType, VirtualFile } from '../../../types/index';

export const generateCsproj = (config: BackendConfig, root: string): VirtualFile => {
  const version = config.backendVersion || '9.0';
  const targetFramework = `net${version}`;
  
  // Package versions often align with major version (e.g., 8.0.x for .NET 8)
  const packageVersion = `${version}.0`; 
  // Exception: OpenAPI in .NET 9 might be 9.0.x but verify compatibility if using older versions
  const openApiVersion = version === '9.0' || version === '10.0' ? '9.0.0' : '8.0.0';

  let dbPackage = '';
  if (config.dbType === DbType.MySQL) {
      dbPackage = `<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="8.0.0" />`; // Pomelo versioning varies, 8.0 usually supports newer
  } else if (config.dbType === DbType.SQLite) {
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="${packageVersion}" />`;
  } else {
      // Default to SQL Server
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="${packageVersion}" />`;
  }

  // Check for Windows Auth
  let authPackage = '';
  if (config.authConfig?.useWindowsAuth) {
      authPackage = `<PackageReference Include="Microsoft.AspNetCore.Authentication.Negotiate" Version="${packageVersion}" />`;
  }

  const content = `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="${openApiVersion}" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="${packageVersion}" />
    ${dbPackage}
    ${authPackage}
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
