# This file is moved to the root directory before building the image

# base node image
FROM node:18-bullseye-slim as base

# set for base and all layer that inherit from it
ENV NODE_ENV production

# Install all node_modules, including dev dependencies
FROM base as deps

WORKDIR /myapp

ADD package.json package-lock.json .npmrc ./
RUN npm install --include=dev

# Setup production node_modules
FROM base as production-deps

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules
ADD package.json package-lock.json .npmrc ./
RUN npm prune --omit=dev

# Build the app
FROM base as build

WORKDIR /myapp

COPY --from=deps /myapp/node_modules /myapp/node_modules


ADD . .
RUN npm run build

# Finally, build the production image with minimal footprint
FROM base

ENV FLY="true"
ENV LITEFS_DIR="/litefs/data"
ENV COMMUNITY_TOKEN_CONTRACT_ADDRESS=""
ENV GOVERNOR_CONTRACT_ADDRESS=""
ENV NEIGHBORS_CONTRACT_ADDRESS=""
ENV EXECUTOR_CONTRACT_ADDRESS=""
ENV INTERNAL_PORT="8080"
ENV PORT="8081"
ENV NODE_ENV="production"

# add shortcut for connecting to database CLI
RUN echo "#!/bin/sh\nset -x\nsqlite3 \$DATABASE_URL" > /usr/local/bin/database-cli && chmod +x /usr/local/bin/database-cli

WORKDIR /myapp

COPY --from=production-deps /myapp/node_modules /myapp/node_modules

COPY --from=build /myapp/server-build /myapp/server-build
COPY --from=build /myapp/build /myapp/build
COPY --from=build /myapp/public /myapp/public
COPY --from=build /myapp/package.json /myapp/package.json

# prepare for litefs
COPY --from=flyio/litefs:0.4.0 /usr/local/bin/litefs /usr/local/bin/litefs
ADD other/litefs.yml /etc/litefs.yml
RUN mkdir -p /data ${LITEFS_DIR}

ADD . .

CMD ["litefs", "mount"]
