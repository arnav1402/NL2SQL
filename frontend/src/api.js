// src/api/api.js

const BASE_URL =
import.meta.env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function request(path, options = {}) {
let res;

try {
    res = await fetch(`${BASE_URL}${path}`, {
    headers: {
        "Content-Type": "application/json",
    },
    ...options,
    });
} catch {
    throw {
    status: 0,
    error: "NetworkError",
    message:
        "Can't reach the server. Check your connection and try again.",
    };
}

let body = null;

try {
    body = await res.json();
} catch {
    // Empty/non-JSON response
}

if (!res.ok) {
    const detail = body?.detail;
    const isStructured =
    detail && typeof detail === "object";

    throw {
    status: res.status,
    error: isStructured
        ? detail.error
        : inferErrorKey(res.status),
    message: isStructured
        ? detail.detail
        : typeof detail === "string"
        ? detail
        : "Something went wrong.",
    };
}

return body;
}

function inferErrorKey(status) {
if (status === 404) return "ConnectionNotFoundError";
if (status === 503) return "ServiceUnavailable";
if (status >= 500) return "InternalServerError";

return "RequestError";
}

// ---------------------------------------------------------
// CONNECTION
// ---------------------------------------------------------

export function createConnection(payload) {
return request("/connection", {
    method: "POST",
    body: JSON.stringify(payload),
});
}

export function listConnections() {
return request("/connection");
}

export function getConnection(connectionId) {
return request(`/connection/${connectionId}`);
}

export function deleteConnection(connectionId) {
return request(`/connection/${connectionId}`, {
    method: "DELETE",
});
}

// ---------------------------------------------------------
// QUERY
// ---------------------------------------------------------

export function runQuery(connectionId, question) {
return request("/query", {
    method: "POST",
    body: JSON.stringify({
    connection_id: connectionId,
    question,
    }),
});
}

// ---------------------------------------------------------
// SCHEMA
// ---------------------------------------------------------

export function refreshSchema(connectionId) {
return request(`/schema/refresh/${connectionId}`, {
    method: "POST",
});
}

// ---------------------------------------------------------
// HEALTH
// ---------------------------------------------------------

export function getHealth() {
return request("/health");
}

export async function checkSession(connectionId) {
await getConnection(connectionId);
return "connected";
}

//visualizing the data base
/** Returns: { connection_id, database_name, db_type, dialect, schema_version, tables: [...] } */
export function getSchemaStructure(connectionId) {
    return request(`/schema/${connectionId}`);
}