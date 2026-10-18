# Security Policy

## Supported versions

The latest release of `screenagents` is supported with security fixes.

## Reporting a vulnerability

Please do not open a public issue for a security problem. Use GitHub's private
reporting instead:

1. Go to the [Security tab](https://github.com/Parithosh-Varma/screenagents/security)
2. Choose **Report a vulnerability**

You will get a response as soon as possible, normally within a few days. Please
include a minimal reproduction and the output of `screenagents --doctor`.

## Design notes

- The core library spawns OS screenshot tools with an argv list — never a shell — so
  paths and regions cannot be interpreted as shell syntax.
- The MCP server speaks stdio only, binds no ports, and is started by the client that
  needs it.
- The landing page ships a strict Content-Security-Policy in `site/public/_headers`.
