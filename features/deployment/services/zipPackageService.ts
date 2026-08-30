import JSZip from 'jszip';
import { GeneratedDeploymentFile } from '../types';

export class ZipPackageService {
  public static async downloadDeploymentZip(
    projectName: string,
    files: GeneratedDeploymentFile[]
  ): Promise<void> {
    const zip = new JSZip();

    for (const file of files) {
      zip.file(file.path, file.content);
    }

    // Add a helpful README.md in the package root
    const readme = `# 🚀 ${projectName} - 1-Click Docker Compose Deployment

Dieses Paket enthält schlüsselfertige Container-Konfigurationen und Skripte zur Bereitstellung des Projekts.

## 📦 Schnellanleitung:

### Option A: 1-Klick Ausführung (Linux / macOS)
\`\`\`bash
chmod +x deploy.sh
./deploy.sh
\`\`\`

### Option B: 1-Klick Ausführung (Windows PowerShell)
\`\`\`powershell
.\\deploy.ps1
\`\`\`

### Option C: Standard Docker Compose
\`\`\`bash
docker compose up -d --build
\`\`\`

## 🌐 Enthaltene Services:
- **Nginx Reverse Proxy:** Port 80
- **Backend API:** Port 5000 /api/
- **PostgreSQL / MySQL:** Port 5432 / 3306 mit automatischem DB-Seed
- **pgAdmin / Adminer:** Port 8080 (optional)

Generiert mit **DB Studio Pro** 1-Click Cloud & Container Engine.
`;

    zip.file('README.md', readme);

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.toLowerCase()}-docker-deployment.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
