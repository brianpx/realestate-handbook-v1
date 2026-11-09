// What `import 'server-only'` resolves to under vitest (vitest.config.ts aliases it here). Next.js provides the
// real module in builds, where importing a server-only file from client code is a build error; tests run in Node
// and only need the import to resolve.
export {};
