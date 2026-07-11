
import { BackendConfig, DbType, VirtualFile } from '../../../types/index';

export const generateCsproj = (config: BackendConfig, root: string): VirtualFile => {
  const version = config.backendVersion || '10.0';
  const targetFramework = `net${version}`;
  const packageVersion = `${version}.0`; 
  
  let openApiVersion = '8.0.0';
  if (version === '10.0') openApiVersion = '10.0.0';
  else if (version === '9.0') openApiVersion = '9.0.0';
  else if (version === '7.0') openApiVersion = '7.0.0';
  else if (version === '6.0') openApiVersion = '6.0.0';

  const isBlazor = config.frontendFramework === 'blazor';

  let dbPackage = '';
  if (config.dbType === DbType.MySQL) {
      const pomeloVersion = (version === '10.0' || version === '9.0') ? '8.0.0' : '7.0.0';
      dbPackage = `<PackageReference Include="Pomelo.EntityFrameworkCore.MySql" Version="${pomeloVersion}" />`;
  } else if (config.dbType === DbType.SQLite) {
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="${packageVersion}" />`;
  } else {
      dbPackage = `<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="${packageVersion}" />`;
  }

  let authPackages = '';
  if (config.authConfig?.useWindowsAuth) {
      authPackages = `
    <PackageReference Include="Microsoft.AspNetCore.Authentication.Negotiate" Version="${packageVersion}" />
    <PackageReference Include="System.DirectoryServices.AccountManagement" Version="${packageVersion}" />
      `;
  }

  let blazorConfig = '';
  if (isBlazor) {
      blazorConfig = `
    <PackageReference Include="Microsoft.AspNetCore.Components.WebAssembly.Server" Version="${packageVersion}" />
    <ItemGroup>
      <ProjectReference Include="..\\${config.projectName}.Client\\${config.projectName}.Client.csproj" />
    </ItemGroup>`;
  }

  const content = `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>${targetFramework}</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <NoWarn>$(NoWarn);NU1901;NU1902;NU1903;NU1904</NoWarn>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="${openApiVersion}" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="${packageVersion}" />
    ${dbPackage}
    ${authPackages}
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
    <PackageReference Include="Quartz.Extensions.Hosting" Version="3.8.0" />
    ${blazorConfig}
  </ItemGroup>

</Project>`;

  return { 
    name: `${config.projectName}.csproj`, 
    path: `${root}/${config.projectName}.csproj`, 
    content: content, 
    language: 'xml' 
  };
};
