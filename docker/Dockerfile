## Dockerfile for deploying the carpentry system to Google Cloud Run
##
## This Dockerfile uses a multi‑stage build to produce a minimal runtime
## image.  The first stage installs production dependencies and builds the
## application (for example a Next.js or Express server).  The second stage
## copies only the build artifacts and production dependencies.
##
## To build locally:
##   docker build -t your-image-name .
##
## The resulting container will listen on port 3000 by default.  Override
## the PORT environment variable to change the listening port.

### -------------------------------------------------------------------
### Stage 1: Install dependencies and build the application
### -------------------------------------------------------------------
FROM node:18-slim AS build

WORKDIR /app

## Copy package definition files first to leverage Docker cache.  This
## ensures that dependency installation is not repeated on every build if
## only application code changes.  The wildcard allows either npm or
## pnpm/yarn lock files to be included without failing.
COPY package.json .
COPY package-lock.json* pnpm-lock.yaml* yarn.lock* ./

## Install dependencies.  Prefer `npm ci` for reproducible installs
## when an npm lockfile is present.  Fallback to pnpm or yarn if those
## lockfiles exist, otherwise default to `npm install`.
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; \
    elif [ -f pnpm-lock.yaml ]; then \
      corepack enable pnpm && pnpm install --frozen-lockfile --prod; \
    elif [ -f yarn.lock ]; then \
      corepack enable yarn && yarn install --production; \
    else \
      npm install --omit=dev; \
    fi

## Copy the rest of the application source code.  The trailing dot tells
## Docker to copy everything in the context into /app.
COPY . .

## Build the project if a build script exists.  Many frameworks
## (Next.js, NestJS, Express with TypeScript) define a `build` script.  If
## no build script is present this step will simply print a message
## without failing.
RUN if npm run | grep -q "build"; then npm run build; else echo "No build step defined"; fi

### -------------------------------------------------------------------
### Stage 2: Prepare a lightweight runtime image
### -------------------------------------------------------------------
FROM node:18-slim AS runtime
WORKDIR /app

## Set production environment variables.  The PORT variable can be
## overridden at runtime by Cloud Run or other orchestrators.
ENV NODE_ENV=production
ENV PORT=3000

## Copy the built application and its dependencies from the build stage.
## Copying the entire /app directory is safe because the build stage only
## contains compiled assets and node_modules as configured above.
COPY --from=build /app /app

## Expose the port that the application listens on.  Cloud Run will
## automatically route traffic to this port.
EXPOSE 3000

## Start the application.  Override this in your Cloud Run service or
## docker run command if your entry point differs (for example, when
## using Next.js standalone server with `node server.js`).
CMD ["npm","start"]