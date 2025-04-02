# Contributing to Dottie AI Assistant

Thank you for your interest in contributing to the Dottie AI Assistant project! This document provides guidelines and instructions for contributing to the development of Dottie.

## Development Workflow

We follow a feature branch workflow with pull requests:

1. **Fork the repository** (external contributors)
2. **Create a feature branch** from the `main` branch
   ```
   git checkout -b feature/your-feature-name
   ```
3. **Implement your changes** following the coding standards
4. **Write tests** for your changes
5. **Run tests** to ensure everything passes
   ```
   npm test
   ```
6. **Commit your changes** with descriptive commit messages
   ```
   git commit -m "feat: add new feature"
   ```
7. **Push your branch** to your fork or the repository
   ```
   git push origin feature/your-feature-name
   ```
8. **Create a pull request** to the `main` branch

## Commit Message Guidelines

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: Code changes that neither fix a bug nor add a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to the build process or auxiliary tools

Example:
```
feat(auth): implement Firebase authentication
```

## Code Style

### TypeScript

- Follow the ESLint configuration provided in the project
- Use TypeScript interfaces and types for all code
- Avoid using `any` type when possible
- Document public functions and classes with JSDoc comments

### React

- Use functional components with hooks
- Keep components small and focused on a single responsibility
- Use TypeScript for props and state definitions
- Follow the project's component organization structure

## Testing

- Write unit tests for all new functionality
- Ensure existing tests pass before submitting a pull request
- Aim for high test coverage, especially for critical paths
- Mock external dependencies appropriately

## Documentation

- Update documentation when changing functionality
- Document all public APIs, components, and functions
- Keep the README.md up to date with any changes to setup or usage

## Pull Request Process

1. Update the README.md or documentation with details of changes if appropriate
2. Update the tests to cover your changes
3. Ensure all tests pass and the build is successful
4. Get a code review from at least one team member
5. Once approved, your pull request will be merged

## Development Environment Setup

Follow these steps to set up your development environment:

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/dottie.git
   cd dottie
   ```

2. **Install dependencies**
   ```
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Fill in the required values for your local development

4. **Start the development servers**
   ```
   # Backend
   cd backend
   npm run dev

   # Frontend
   cd ../frontend
   npm run dev
   ```

## Branching Strategy

- `main`: Production-ready code
- `develop`: Integration branch for features
- `feature/*`: Feature branches
- `fix/*`: Bug fix branches
- `release/*`: Release preparation branches

## Release Process

1. Create a release branch from `develop`
   ```
   git checkout -b release/v1.0.0 develop
   ```

2. Update version numbers in:
   - package.json
   - README.md
   - Any other version-specific files

3. Create a pull request to `main`

4. After merging to `main`, tag the release
   ```
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

5. Merge `main` back into `develop`

## Questions or Need Help?

If you have questions or need help with the contribution process, please reach out to the development team.
