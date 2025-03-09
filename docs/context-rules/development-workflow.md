# Development Workflow Guidelines

This document outlines the development workflow and branching strategy for the LearningCrypto Platform.

## Git Branching Strategy

### Main Branch (Production)
- The `main` branch represents the production-ready code that is deployed to the live environment
- Direct commits to `main` are not allowed
- All changes to `main` must come through pull requests from the `development` branch
- The `main` branch is deployed automatically to the production environment in Vercel

### Development Branch
- The `development` branch is the primary branch for ongoing development
- All feature development, bug fixes, and enhancements should be committed to this branch
- The `development` branch is deployed to a preview environment in Vercel for testing

### Feature Branches (Optional)
- For significant features, create a feature branch from `development`
- Name feature branches with a descriptive prefix: `feature/feature-name`
- Bug fix branches should use the prefix: `fix/bug-name`
- Enhancement branches should use the prefix: `enhancement/name`

## Development Workflow

1. **Start with Development Branch**
   ```bash
   # Ensure you're on the development branch
   git checkout development
   
   # Pull the latest changes
   git pull origin development
   ```

2. **Create Feature Branch (Optional)**
   ```bash
   # For significant features
   git checkout -b feature/your-feature-name development
   ```

3. **Make Changes and Commit**
   ```bash
   # Add your changes
   git add .
   
   # Commit with descriptive message
   git commit -m "Descriptive message about your changes"
   ```

4. **Push Changes**
   ```bash
   # If on development branch
   git push origin development
   
   # If on feature branch
   git push origin feature/your-feature-name
   ```

5. **Merge Feature Branch to Development (if applicable)**
   ```bash
   # Switch to development
   git checkout development
   
   # Merge your feature branch
   git merge feature/your-feature-name
   
   # Push the merged changes
   git push origin development
   ```

6. **Deploy to Production**
   ```bash
   # Ensure all changes are tested on the development environment
   
   # Switch to main branch
   git checkout main
   
   # Merge development into main
   git merge development
   
   # Push to deploy to production
   git push origin main
   ```

## Environment Variables

- Environment variables should be set in Vercel for both production and development environments
- Local development should use a `.env.local` file (not committed to Git)
- Required environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_VERCEL_URL`
  - `NEXT_PUBLIC_SITE_URL`
  - Additional variables as needed for services (Stripe, OpenAI, etc.)

## Code Standards

- Write clean, readable, and well-documented code
- Use TypeScript for type safety
- Follow the project's established patterns and conventions
- Add appropriate comments and documentation
- Write tests for critical functionality

## Pull Request Process

1. Create a pull request from your branch to the `development` branch
2. Provide a clear description of the changes
3. Reference any related issues
4. Ensure all automated tests and checks pass
5. Request review from at least one team member
6. Address review comments and update the PR
7. Merge after approval

## Vercel Deployments

- The `main` branch deploys to the production environment
- The `development` branch deploys to a preview environment
- Feature branches can be deployed to preview environments for testing

## Debugging Production Issues

- Never debug directly on the production environment
- Replicate the issue on the development environment
- Add console logs or debugging code to the development branch
- Test the fix on the development environment before deploying to production 