FROM denoland/deno:alpine-2.1.2

WORKDIR /app

EXPOSE 3000

COPY . .
RUN deno install
RUN deno task build

ENTRYPOINT ["deno", "task", "start"]


### Build Command
# > docker build -t atemporalfilm-com .
# > docker buildx build --platform linux/amd64 -t atemporalfilm-com .
