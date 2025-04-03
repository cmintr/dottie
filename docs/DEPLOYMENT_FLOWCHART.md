# Dottie AI Assistant: Deployment Flowchart

This document provides a visual representation of the deployment process for the Dottie AI Assistant using Terraform and Cloud Build. It's designed to help non-technical users understand the deployment flow.

## Overall Deployment Process

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  1. Set Up GCP  │────>│ 2. Infrastructure│────>│  3. Application  │
│    Environment  │     │   Deployment    │     │    Deployment    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│  5. Monitoring  │<────│  4. Verification│<─────────────┘
│  & Maintenance  │     │    & Testing    │
└─────────────────┘     └─────────────────┘
```

## 1. Set Up GCP Environment

```
┌─────────────────┐
│ Create/Select   │
│   GCP Project   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Enable Required │
│      APIs       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Set Up Secret  │
│     Manager     │
└─────────────────┘
```

## 2. Infrastructure Deployment with Terraform

```
┌─────────────────┐
│    Initialize   │
│    Terraform    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Create tfvars  │
│      File       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run Terraform  │
│      Plan       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Run Terraform  │
│      Apply      │
└─────────────────┘
```

## 3. Application Deployment with Cloud Build

```
┌─────────────────┐
│ Deploy Backend  │
│  with Cloud Build│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy API      │
│ Gateway         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Deploy Frontend │
│ to Firebase     │
└─────────────────┘
```

## 4. Verification & Testing

```
┌─────────────────┐
│  Verify Backend │
│     Service     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Verify Frontend │
│    Application  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Test Core     │
│  Functionality  │
└─────────────────┘
```

## 5. Monitoring & Maintenance

```
┌─────────────────┐
│  Set Up Cloud   │
│   Monitoring    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Configure      │
│   Alerts        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Regular Updates │
│ & Maintenance   │
└─────────────────┘
```

## Troubleshooting Decision Tree

```
┌─────────────────┐
│  Deployment     │
│    Issue        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Which Phase?   │
└────────┬────────┘
         │
    ┌────┴─────┬────────┬────────┐
    │          │         │         │
    ▼          ▼         ▼         ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ Terraform│ │Cloud    │ │Frontend │ │App      │
│ Error    │ │Build    │ │Deploy   │ │Runtime  │
└────┬─────┘ └────┬────┘ └────┬────┘ └────┬────┘
     │           │          │          │
     ▼           ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Check API │ │Check    │ │Check    │ │Check    │
│Permissions│ │Logs     │ │Firebase │ │Secrets  │
└─────────┘ └─────────┘ └─────────┘ └─────────┘
```

## Resource Relationships

```
┌───────────────────────────────────────────────────────┐
│                  Google Cloud Platform                 │
│                                                       │
│  ┌─────────────┐       ┌─────────────┐                │
│  │  Firebase   │◄─────►│  Firestore  │                │
│  │  Hosting    │       │  Database   │                │
│  └──────┬──────┘       └──────┬──────┘                │
│         │                     │                       │
│         │                     │                       │
│         ▼                     ▼                       │
│  ┌─────────────┐       ┌─────────────┐                │
│  │  Frontend   │       │   Backend   │                │
│  │  Application│◄─────►│   Service   │                │
│  └─────────────┘       └──────┬──────┘                │
│                               │                       │
│                               │                       │
│                               ▼                       │
│                        ┌─────────────┐                │
│                        │     API     │                │
│                        │   Gateway   │                │
│                        └─────────────┘                │
│                               ▲                       │
│                               │                       │
│                        ┌─────────────┐                │
│                        │   Secret    │                │
│                        │   Manager   │                │
│                        └─────────────┘                │
└───────────────────────────────────────────────────────┘
```

This flowchart provides a visual guide to help you understand the deployment process. Use it alongside the `SIMPLIFIED_DEPLOYMENT_GUIDE.md` and `TERRAFORM_DEPLOYMENT_CHECKLIST.md` for a complete deployment experience.