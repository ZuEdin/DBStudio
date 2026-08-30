export type BackendLanguageType = 'nodejs' | 'dotnet' | 'python' | 'go' | 'php' | 'rust';
export type DatabaseEngineType = 'postgres' | 'mysql' | 'mssql' | 'sqlite';
export type ReverseProxyType = 'nginx' | 'traefik' | 'caddy' | 'none';
export type CloudTargetType = 'docker_compose' | 'cloud_run' | 'aws_ecs' | 'azure_container' | 'digitalocean';

export interface DockerStackConfig {
  projectName: string;
  backendLanguage: BackendLanguageType;
  backendVersion: string;
  backendPort: number;
  
  frontendFramework: 'react' | 'vue' | 'angular' | 'static';
  frontendPort: number;
  includeFrontend: boolean;

  dbEngine: DatabaseEngineType;
  dbVersion: string;
  dbPort: number;
  dbName: string;
  dbUser: string;
  dbPassword: string;
  dbVolume: string;

  reverseProxy: ReverseProxyType;
  httpPort: number;
  httpsPort: number;
  domainName: string;
  enableSsl: boolean;

  includeRedis: boolean;
  redisPort: number;

  includeDbAdmin: boolean; // pgAdmin or Adminer
  dbAdminPort: number;

  includeTelemetry: boolean; // Prometheus + Grafana
  telemetryPort: number;

  cloudTarget: CloudTargetType;
  restartPolicy: 'always' | 'unless-stopped' | 'on-failure' | 'no';
  enableHealthchecks: boolean;
  enableAutoMigrate: boolean;
  enableSeedData: boolean;
}

export interface GeneratedDeploymentFile {
  name: string;
  path: string;
  language: string;
  content: string;
  description: string;
  category: 'compose' | 'dockerfile' | 'config' | 'database' | 'script' | 'cloud';
}
