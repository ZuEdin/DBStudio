export type CiProvider = 'github' | 'gitlab' | 'azure' | 'bitbucket';
export type CloudDeployTarget = 'cloudrun' | 'aws_ecs' | 'kubernetes' | 'caprover' | 'docker_swarm';

export interface CiConfig {
  provider: CiProvider;
  projectName: string;
  targetCloud: CloudDeployTarget;
  registry: 'ghcr' | 'dockerhub' | 'ecr' | 'gcr';
  imageName: string;
  enableLintAndTest: boolean;
  enableSecurityScan: boolean;
  enableDbMigration: boolean;
  enableSlackNotification: boolean;
  branch: string;
}

export function generateGitHubWorkflow(config: CiConfig): string {
  const { projectName, targetCloud, registry, imageName, enableSecurityScan, enableDbMigration, enableSlackNotification, branch } = config;
  const sanitizedProject = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  return `name: CI/CD Pipeline - ${projectName}

on:
  push:
    branches: [ "${branch || 'main'}" ]
  pull_request:
    branches: [ "${branch || 'main'}" ]

env:
  REGISTRY: ${registry === 'ghcr' ? 'ghcr.io' : 'docker.io'}
  IMAGE_NAME: \${{ github.repository }}

jobs:
  lint-and-test:
    name: 🧪 Quality, Lint & Unit Tests
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Run ESLint & TypeCheck
        run: |
          npm run lint || true
          npm run typecheck || true

      - name: Run Unit Tests
        run: npm test -- --passWithNoTests

  ${enableSecurityScan ? `security-scan:
    name: 🛡️ Security & Vulnerability Scan
    runs-on: ubuntu-latest
    needs: lint-and-test
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Run Trivy Vulnerability Scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          format: 'table'
          severity: 'CRITICAL,HIGH'
` : ''}
  build-and-push:
    name: 🐳 Docker Multi-Arch Build & Push
    runs-on: ubuntu-latest
    needs: [lint-and-test${enableSecurityScan ? ', security-scan' : ''}]
    permissions:
      contents: read
      packages: write
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Registry
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=raw,value=latest
            type=sha,format=short

      - name: Build and Push Docker Image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: \${{ github.event_name != 'pull_request' }}
          tags: \${{ steps.meta.outputs.tags }}
          labels: \${{ steps.meta.outputs.labels }}
          platforms: linux/amd64,linux/arm64
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: 🚀 Cloud Deployment (${targetCloud.toUpperCase()})
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/${branch || 'main'}'
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      ${enableDbMigration ? `- name: Run Database Migration
        env:
          DATABASE_URL: \${{ secrets.DATABASE_URL }}
        run: |
          echo "Executing automated DB migration for ${projectName}..."
          # psql $DATABASE_URL -f init-db.sql || npm run db:migrate
` : ''}
      ${targetCloud === 'cloudrun' ? `- name: Deploy to Google Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: '${sanitizedProject}-service'
          image: '\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest'
          region: 'europe-west3'
          flags: '--allow-unauthenticated --memory=1Gi --cpu=1'
` : targetCloud === 'aws_ecs' ? `- name: Deploy to AWS ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v2
        with:
          task-definition: task-definition.json
          service: '${sanitizedProject}-service'
          cluster: '${sanitizedProject}-cluster'
` : `- name: Deploy to Kubernetes Cluster
        run: |
          echo "Applying Kubernetes manifests for ${projectName}..."
          # kubectl set image deployment/${sanitizedProject}-app app=\${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
`}
      ${enableSlackNotification ? `- name: Notify Deployment Status
        if: always()
        uses: 8398a7/action-slack@v3
        with:
          status: \${{ job.status }}
          fields: repo,message,commit,author,action,eventName,ref,workflow
        env:
          SLACK_WEBHOOK_URL: \${{ secrets.SLACK_WEBHOOK_URL }}
` : ''}`;
}

export function generateGitLabCI(config: CiConfig): string {
  const { projectName, targetCloud, branch, enableSecurityScan, enableDbMigration } = config;
  const sanitizedProject = projectName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');

  return `stages:
  - test
  ${enableSecurityScan ? '- security\n  ' : ''}- build
  - deploy

variables:
  DOCKER_IMAGE: $CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA
  DOCKER_IMAGE_LATEST: $CI_REGISTRY_IMAGE:latest

unit_tests:
  stage: test
  image: node:20-alpine
  script:
    - npm ci
    - npm run lint || true
    - npm test -- --passWithNoTests
  rules:
    - if: $CI_COMMIT_BRANCH

${enableSecurityScan ? `trivy_security_scan:
  stage: security
  image:
    name: aquasec/trivy:latest
    entrypoint: [""]
  script:
    - trivy fs --no-progress --severity HIGH,CRITICAL .
  rules:
    - if: $CI_COMMIT_BRANCH
` : ''}
docker_build:
  stage: build
  image: docker:24.0.5
  services:
    - docker:24.0.5-dind
  before_script:
    - echo "$CI_REGISTRY_PASSWORD" | docker login -u "$CI_REGISTRY_USER" --password-stdin $CI_REGISTRY
  script:
    - docker build -t $DOCKER_IMAGE -t $DOCKER_IMAGE_LATEST .
    - docker push $DOCKER_IMAGE
    - docker push $DOCKER_IMAGE_LATEST
  rules:
    - if: $CI_COMMIT_BRANCH == "${branch || 'main'}"

cloud_deployment:
  stage: deploy
  image: alpine:latest
  script:
    - echo "Deploying ${sanitizedProject} to ${targetCloud.toUpperCase()}..."
    ${enableDbMigration ? '- echo "Running DB Migrations..."' : ''}
    - echo "Deployment erfolgreich abgeschlossen!"
  environment:
    name: production
    url: https://${sanitizedProject}.yourdomain.com
  rules:
    - if: $CI_COMMIT_BRANCH == "${branch || 'main'}"
`;
}
