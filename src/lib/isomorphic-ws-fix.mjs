/** Next.js browser shim — isomorphic-ws breaks under the Next webpack target. */
export default globalThis.WebSocket;
export const WebSocket = globalThis.WebSocket;
