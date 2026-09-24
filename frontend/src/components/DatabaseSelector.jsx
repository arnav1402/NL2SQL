import { useState } from "react";

import { createConnection, uploadCsv } from "../api";
import {
    FiUploadCloud,
    FiFileText,
    FiX,
} from "react-icons/fi";

import PostgresSQLIcon from "../assets/PostgresSQL.svg";
import MySQLIcon from "../assets/MySQL.svg";
import SQLiteIcon from "../assets/SQLite.svg";
import CSV from "../assets/CSV.svg";
import "./DatabaseSelector.css";

/*
 * =========================================================
 * DATABASE OPTIONS
 * =========================================================
 */

const DATABASE_OPTIONS = [
    {
        id: "postgresql",
        name: "PostgreSQL",
        logo: PostgresSQLIcon,
        color: "#336791",
    },
    {
        id: "mysql",
        name: "MySQL",
        logo: MySQLIcon,
        color: "#00758F",
    },
    {
        id: "sqlite",
        name: "SQLite",
        logo: SQLiteIcon,
        color: "#0F80CC",
    },
    {
        id: "csv",
        name: "CSV File",
        logo: CSV,
        color: "#21a366",
    },
];

/*
 * =========================================================
 * EMPTY FORM STATE
 *
 * IMPORTANT:
 * These are intentionally EMPTY.
 *
 * The values below are used as placeholders only.
 * They are NOT submitted automatically.
 * =========================================================
 */

const EMPTY_FORM_DATA = {
    host: "",
    port: "",
    username: "",
    password: "",
    database: "",
    schema: "",
    sqlite_path: "",
    table_name: "",
};

/*
 * =========================================================
 * PLACEHOLDERS
 * =========================================================
 */

const FORM_PLACEHOLDERS = {
    postgresql: {
        host: "localhost",
        port: "5432",
        username: "postgres",
        password: "Enter password",
        database: "postgres",
        schema: "public",
    },

    mysql: {
        host: "localhost",
        port: "3306",
        username: "root",
        password: "Enter password",
        database: "mysql",
    },

    sqlite: {
        sqlite_path: "./data/mydb.db",
    },
};

/*
 * =========================================================
 * COMPONENT
 * =========================================================
 */

export default function DatabaseSelector({
    isOpen,
    onClose,
    onConnect,
}) {
    /*
     * "select"  = choose database
     * "details" = enter connection details
     */

    const [view, setView] = useState("select");

    const [selectedDatabase, setSelectedDatabase] =
        useState(null);

    const [formData, setFormData] =
        useState(EMPTY_FORM_DATA);

    const [csvFile, setCsvFile] = useState(null);    
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);

    // const [csvFile, setCsvFile] = useState(null);
    const [isCsvDragging, setIsCsvDragging] = useState(false);

    // const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(null);

    /*
     * =====================================================
     * CLOSED
     * =====================================================
     */

    if (!isOpen) {
        return null;
    }

    /*
     * =====================================================
     * SELECTED DATABASE
     * =====================================================
     */

    const selectedDatabaseData =
        DATABASE_OPTIONS.find(
            (database) =>
                database.id === selectedDatabase
        );

    const placeholders =
        FORM_PLACEHOLDERS[selectedDatabase] || {};

    /*
     * =====================================================
     * CLOSE MODAL
     * =====================================================
     */

    const handleClose = () => {
        if (loading) {
            return;
        }

        setError(null);
        setLoading(false);

        setView("select");
        setSelectedDatabase(null);

        setFormData(EMPTY_FORM_DATA);        
        setCsvFile(null);     
        onClose();
    };

    /*
     * =====================================================
     * SELECT DATABASE
     * =====================================================
     */

    const handleDatabaseChange = (databaseId) => {
        setSelectedDatabase(databaseId);

        setError(null);

        /*
         * IMPORTANT:
         *
         * We reset all actual values to empty.
         * Database-specific defaults are handled through
         * placeholders instead.
         */

        setFormData(EMPTY_FORM_DATA);        
        setCsvFile(null);       
         /*\n         * Move to connection form.
         */

        setView("details");
    };

    /*
     * =====================================================
     * BACK
     * =====================================================
     */

    const handleBack = () => {
        if (loading) {
            return;
        }

        setError(null);

        setView("select");
        setSelectedDatabase(null);

        setFormData(EMPTY_FORM_DATA);        
        setCsvFile(null);    
    };    /*\n     * =====================================================\n     * FORM CHANGE
     * =====================================================
     */

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError(null);
    };

    /*
     * =====================================================
     * CSV FILE HANDLING
     * =====================================================
     */

    const handleCsvFile = (file) => {
        if (!file) {
            return;
        }

        if (!file.name.toLowerCase().endsWith(".csv")) {
            setCsvFile(null);
            setError("Please select a CSV file.");
            return;
        }

        setCsvFile(file);
        setError(null);
    };

    const handleCsvDrop = (event) => {
        event.preventDefault();
        setIsCsvDragging(false);

        if (loading) {
            return;
        }

        handleCsvFile(event.dataTransfer.files?.[0]);
    };

    const handleCsvBrowse = (event) => {
        handleCsvFile(event.target.files?.[0]);
        event.target.value = "";
    };

    const handleCsvDragOver = (event) => {
        event.preventDefault();

        if (!loading) {
            setIsCsvDragging(true);
        }
    };

    const handleCsvDragLeave = (event) => {
        event.preventDefault();
        setIsCsvDragging(false);
    };

    const removeCsvFile = () => {
        if (loading) {
            return;
        }

        setCsvFile(null);
        setError(null);
    };

    /*
     * =====================================================
     * BUILD BACKEND PAYLOAD
     *
     * Backend logic is unchanged.
     * =====================================================
     */

    const buildPayload = () => {
        if (selectedDatabase === "postgresql") {
            return {
                db_type: "postgresql",

                host: formData.host.trim(),

                port: Number(formData.port),

                username:
                    formData.username.trim(),

                password: formData.password,

                database:
                    formData.database.trim(),

                schema:
                    formData.schema.trim(),
            };
        }

        if (selectedDatabase === "mysql") {
            return {
                db_type: "mysql",

                host: formData.host.trim(),

                port: Number(formData.port),

                username:
                    formData.username.trim(),

                password: formData.password,

                database:
                    formData.database.trim(),
            };
        }

        return {
            db_type: "sqlite",

            sqlite_path:
                formData.sqlite_path.trim(),
        };
    };

    /*
     * =====================================================
     * SUBMIT
     * =====================================================
     */

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let result;

            if (selectedDatabase === "csv") {
                if (!csvFile) {
                    throw new Error("Please select a CSV file to upload.");
                }

                result = await uploadCsv(
                    csvFile,
                    formData.table_name.trim() || "data"
                );
            } else {
                const payload = buildPayload();

                console.log(
                    "Sending connection payload:",
                    payload
                );

                result = await createConnection(payload);
            }

            console.log(
                "Backend connection response:",
                result
            );

            if (!result?.connection_id) {
                throw new Error(
                    "Backend did not return a connection ID."
                );
            }

            /*
             * Reset modal state before parent closes it.
             */

            setView("select");
            setSelectedDatabase(null);
            setFormData(EMPTY_FORM_DATA);
            setCsvFile(null);
            setIsCsvDragging(false);
            setError(null);

            onConnect(result);
        } catch (err) {
            console.error(
                "Database connection failed:",
                err
            );

            setError(
                err?.message ||
                    "Unable to connect to the database."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
     * =====================================================
     * RENDER
     * =====================================================
     */

    return (
        <div
            className="database-selector-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Connect database"
        >
            <div
                className={
                    view === "details"
                        ? "database-selector is-details"
                        : "database-selector"
                }
            >

                {/* =================================================
                    DATABASE SELECTION
                ================================================= */}

                {view === "select" && (
                    <>
                        <div className="database-selector-header">

                            <div>
                                <div className="database-selector-eyebrow">
                                    DATA SOURCE
                                </div>

                                <h2>
                                    Connect your database
                                </h2>

                                <p>
                                    Provide your database
                                    credentials to start
                                    querying your data.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="database-selector-close"
                                onClick={handleClose}
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                        <div className="database-options">

                            {DATABASE_OPTIONS.map(
                                (database) => (
                                    <button
                                        key={database.id}
                                        type="button"
                                        className="database-option"
                                        style={{
                                            "--database-color":
                                                database.color,
                                        }}
                                        onClick={() =>
                                            handleDatabaseChange(
                                                database.id
                                            )
                                        }
                                    >

                                        <span className="database-option-icon">
                                            {database.logo ? (
                                                <img
                                                    src={database.logo}
                                                    alt=""
                                                />
                                            ) : (
                                                <span className="database-option-icon-fallback">
                                                    CSV
                                                </span>
                                            )}
                                        </span>

                                        <span className="database-option-name">
                                            {database.name}
                                        </span>

                                        <span className="database-option-arrow">
                                            →
                                        </span>

                                    </button>
                                )
                            )}

                        </div>

                        <div className="database-selector-footer">
                            <span className="database-footer-dot" />

                            <span>
                                SELECT A DATA SOURCE TO CONTINUE
                            </span>
                        </div>
                    </>
                )}

                {/* =================================================
                    CONNECTION DETAILS
                ================================================= */}

                {view === "details" && (
                    <>
                        <div className="database-selector-header">

                            <button
                                type="button"
                                className="database-back"
                                onClick={handleBack}
                                disabled={loading}
                            >
                                ← Back
                            </button>

                            <div className="database-selector-eyebrow">
                                DATABASE CONNECTION
                            </div>

                            <h2>
                                Connect your database
                            </h2>

                            <p>
                                Enter the credentials for your{" "}
                                {selectedDatabaseData?.name}{" "}
                                database.
                            </p>

                            <button
                                type="button"
                                className="database-selector-close"
                                onClick={handleClose}
                                disabled={loading}
                                aria-label="Close"
                            >
                                ×
                            </button>

                        </div>

                        <div className="database-connection-form">

                            {/* =====================================
                                SELECTED DATABASE
                            ===================================== */}

                            <div
                                className="selected-database-bar"
                                style={{
                                    "--database-color":
                                        selectedDatabaseData?.color,
                                }}
                            >
                                <div className="selected-database-logo">
                                    {selectedDatabaseData?.logo ? (
                                        <img
                                            src={selectedDatabaseData.logo}
                                            alt=""
                                        />
                                    ) : (
                                        <span className="database-option-icon-fallback">
                                            CSV
                                        </span>
                                    )}
                                </div>

                                <span>
                                    {selectedDatabaseData?.name}
                                </span>
                            </div>

                            <form
                                onSubmit={handleSubmit}
                            >

                                {/* =================================
                                    POSTGRES / MYSQL
                                ================================= */}

                                {selectedDatabase !== "sqlite" &&
                                    selectedDatabase !== "csv" && (
                                    <>
                                        <div className="connection-fields">

                                            {/* HOST */}

                                            <div className="connection-field">
                                                <label className="connection-field-label">
                                                    Host
                                                </label>

                                                <input
                                                    name="host"
                                                    type="text"
                                                    value={
                                                        formData.host
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder={
                                                        placeholders.host
                                                    }
                                                    autoComplete="off"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>

                                            {/* PORT */}

                                            <div className="connection-field">
                                                <label className="connection-field-label">
                                                    Port
                                                </label>

                                                <input
                                                    name="port"
                                                    type="number"
                                                    min="1"
                                                    max="65535"
                                                    value={
                                                        formData.port
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder={
                                                        placeholders.port
                                                    }
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>

                                            {/* USERNAME */}

                                            <div className="connection-field">
                                                <label className="connection-field-label">
                                                    Username
                                                </label>

                                                <input
                                                    name="username"
                                                    type="text"
                                                    value={
                                                        formData.username
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder={
                                                        placeholders.username
                                                    }
                                                    autoComplete="username"
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>

                                            {/* PASSWORD */}

                                            <div className="connection-field">
                                                <label className="connection-field-label">
                                                    Password
                                                </label>

                                                <input
                                                    name="password"
                                                    type="password"
                                                    value={
                                                        formData.password
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder={
                                                        placeholders.password
                                                    }
                                                    autoComplete="current-password"
                                                    disabled={loading}
                                                />
                                            </div>

                                            {/* DATABASE */}

                                            <div className="connection-field connection-field--full">
                                                <label className="connection-field-label">
                                                    Database
                                                </label>

                                                <input
                                                    name="database"
                                                    type="text"
                                                    value={
                                                        formData.database
                                                    }
                                                    onChange={
                                                        handleChange
                                                    }
                                                    placeholder={
                                                        placeholders.database
                                                    }
                                                    required
                                                    disabled={loading}
                                                />
                                            </div>

                                            {/* POSTGRES SCHEMA */}

                                            {selectedDatabase ===
                                                "postgresql" && (
                                                <div className="connection-field connection-field--full">

                                                    <label className="connection-field-label">
                                                        Schema
                                                    </label>

                                                    <input
                                                        name="schema"
                                                        type="text"
                                                        value={
                                                            formData.schema
                                                        }
                                                        onChange={
                                                            handleChange
                                                        }
                                                        placeholder={
                                                            placeholders.schema
                                                        }
                                                        required
                                                        disabled={loading}
                                                    />

                                                </div>
                                            )}

                                        </div>
                                    </>
                                )}

                                {/* =================================
                                    SQLITE
                                ================================= */}

                                {selectedDatabase ===
                                    "sqlite" && (
                                    <div className="connection-fields">

                                        <div className="connection-field connection-field--full">

                                            <label className="connection-field-label">
                                                SQLite file path
                                            </label>

                                            <input
                                                name="sqlite_path"
                                                type="text"
                                                value={
                                                    formData.sqlite_path
                                                }
                                                onChange={
                                                    handleChange
                                                }
                                                placeholder={
                                                    placeholders.sqlite_path
                                                }
                                                required
                                                disabled={loading}
                                            />

                                        </div>

                                    </div>
                                )}

                                {/* =================================
                                    CSV
                                ================================= */}

                                {selectedDatabase === "csv" && (
                                    <div className="csv-connection-fields">

                                        <div className="connection-field connection-field--full">
                                            <label className="connection-field-label">
                                                CSV File
                                            </label>

                                            <div
                                                className={`csv-upload-zone${
                                                    isCsvDragging
                                                        ? " is-dragging"
                                                        : ""
                                                }${
                                                    csvFile
                                                        ? " has-file"
                                                        : ""
                                                }${
                                                    loading
                                                        ? " is-disabled"
                                                        : ""
                                                }`}
                                                onDragOver={handleCsvDragOver}
                                                onDragLeave={handleCsvDragLeave}
                                                onDrop={handleCsvDrop}
                                            >
                                                <input
                                                    id="csv-file-input"
                                                    className="csv-file-input"
                                                    type="file"
                                                    accept=".csv,text/csv"
                                                    onChange={handleCsvBrowse}
                                                    disabled={loading}
                                                />

                                                {csvFile ? (
                                                    <div className="csv-upload-file">
                                                        <div className="csv-upload-file-icon">
                                                            <FiFileText />
                                                        </div>

                                                        <div className="csv-upload-file-info">
                                                            <span className="csv-upload-file-name">
                                                                {csvFile.name}
                                                            </span>

                                                            <span className="csv-upload-file-meta">
                                                                CSV file selected
                                                            </span>
                                                        </div>

                                                        <button
                                                            type="button"
                                                            className="csv-upload-remove"
                                                            onClick={removeCsvFile}
                                                            disabled={loading}
                                                            aria-label="Remove CSV file"
                                                            title="Remove file"
                                                        >
                                                            <FiX />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <label
                                                        htmlFor="csv-file-input"
                                                        className="csv-upload-content"
                                                    >
                                                        <span className="csv-upload-icon">
                                                            <FiUploadCloud />
                                                        </span>

                                                        <span className="csv-upload-title">
                                                            Drop your CSV file here
                                                        </span>

                                                        <span className="csv-upload-subtitle">
                                                            or{" "}
                                                            <span className="csv-upload-browse">
                                                                browse files
                                                            </span>
                                                        </span>

                                                        <span className="csv-upload-hint">
                                                            CSV files only
                                                        </span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <div className="connection-field connection-field--full">
                                            <label className="connection-field-label">
                                                Table Name
                                            </label>

                                            <input
                                                name="table_name"
                                                type="text"
                                                value={formData.table_name}
                                                onChange={handleChange}
                                                placeholder="data"
                                                disabled={loading}
                                            />

                                            <span className="connection-field-hint">
                                                Leave empty to use "data".
                                            </span>
                                        </div>

                                    </div>
                                )}


                                {/* =================================
                                    ERROR
                                ================================= */}

                                {error && (
                                    <div
                                        className="connection-error"
                                        role="alert"
                                    >
                                        <span>
                                            !
                                        </span>

                                        <p>
                                            {error}
                                        </p>
                                    </div>
                                )}

                                {/* =================================
                                    CONNECT BUTTON
                                ================================= */}

                                <button
                                    type="submit"
                                    className="establish-button"
                                    style={{
                                        "--database-color":
                                            selectedDatabaseData?.color,
                                    }}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="connection-spinner" />

                                            Connecting

                                            <span className="connection-dots">
                                                ...
                                            </span>
                                        </>
                                    ) : (
                                        "Connect database"
                                    )}
                                </button>

                            </form>

                        </div>
                    </>
                )}

            </div>
        </div>
    );
}