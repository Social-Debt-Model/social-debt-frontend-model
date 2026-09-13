import { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const VALID_COMMENT_HEADERS = [
  "comment_body_raw",
  "comment",
  "body",
  "text",
  "content",
  "description",
  "comentario",
];
export const VALID_ISSUE_HEADERS = [
  "issue_number",
  "issue",
  "ticket",
  "issue_id",
];
export const VALID_ID_HEADERS = ["comment_id", "id", "uuid", "message_id"];
export const VALID_AUTHOR_HEADERS = ["author", "user", "creator", "usuario", "creador", "autor", "username", "nombre", "comment_author", "author_name", "author_login", "user_id"];

export type ValidationReport = {
  detectedColumns: string[];
  hasCommentColumn: boolean;
  matchedCommentColumn?: string;
  matchedAuthorColumn?: string;
  hasAuthorColumn?: boolean;
  hasIssueColumn: boolean;
  matchedIssueColumn?: string;
  hasIdColumn: boolean;
  matchedIdColumn?: string;
  isValid: boolean;
  totalRows?: number;
  missingIdCount?: number;
  missingIssueCount?: number;
};

export type FileProcessingResult = {
  valid: boolean;
  file?: File;
  hasOrphans?: boolean;
  parsedData?: Record<string, unknown>[];
  issueColumnName?: string;
  report?: ValidationReport;
};

export const useFileValidation = () => {
  const [error, setError] = useState<string | null>(null);

  const validateHeaders = (headers: string[]): ValidationReport => {
    const matchedCommentColumn = headers.find((h) =>
      VALID_COMMENT_HEADERS.includes(h.toLowerCase().trim()),
    );

    const matchedIssueColumn = headers.find((h) =>
      VALID_ISSUE_HEADERS.includes(h.toLowerCase().trim()),
    );


    const matchedAuthorColumn = headers.find((h) =>
      VALID_AUTHOR_HEADERS.includes(h.toLowerCase().trim()),
    );

    const matchedIdColumn = headers.find((h) =>
      VALID_ID_HEADERS.includes(h.toLowerCase().trim()),
    );

    return {
      detectedColumns: headers,
      hasCommentColumn: !!matchedCommentColumn,
      matchedCommentColumn,
      hasIssueColumn: !!matchedIssueColumn,
      matchedIssueColumn,
      hasAuthorColumn: !!matchedAuthorColumn,
      matchedAuthorColumn,
      hasIdColumn: !!matchedIdColumn,
      matchedIdColumn,
      isValid: !!matchedCommentColumn,
    };
  };

  const processFile = async (file: File): Promise<FileProcessingResult> => {
    setError(null);

    return new Promise((resolve) => {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "csv") {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: "greedy",
          complete: (results: Papa.ParseResult<Record<string, unknown>>) => {
            const headers = results.meta.fields || [];
            const report = validateHeaders(headers);

            if (!report.isValid) {
              resolve({ valid: false, report });
              return;
            }

            const data = results.data as Record<string, unknown>[];
            let hasOrphans = false;
            let missingIssueCount = 0;
            let missingIdCount = 0;

            if (!report.matchedIssueColumn) {
              missingIssueCount = data.length;
              hasOrphans = data.length > 0;
            } else {
              data.forEach((row) => {
                if (
                  !row[report.matchedIssueColumn!] ||
                  String(row[report.matchedIssueColumn!]).trim() === ""
                ) {
                  missingIssueCount++;
                  hasOrphans = true;
                }
              });
            }

            if (!report.matchedIdColumn) {
              missingIdCount = data.length;
            } else {
              data.forEach((row) => {
                if (
                  !row[report.matchedIdColumn!] ||
                  String(row[report.matchedIdColumn!]).trim() === ""
                ) {
                  missingIdCount++;
                }
              });
            }

            report.totalRows = data.length;
            report.missingIssueCount = missingIssueCount;
            report.missingIdCount = missingIdCount;

            const finalData = data.map((row, idx) => {
              const newRow = { ...row };
              if (!report.matchedIdColumn) {
                newRow.comment_id = `auto-id-${idx + 1}`;
              } else if (
                !newRow[report.matchedIdColumn] ||
                String(newRow[report.matchedIdColumn]).trim() === ""
              ) {
                newRow[report.matchedIdColumn] = `auto-id-${idx + 1}`;
              }
              return newRow;
            });

            resolve({
              valid: true,
              file,
              hasOrphans,
              parsedData: finalData,
              issueColumnName: report.matchedIssueColumn,
              report,
            });
          },
          error: () => {
            setError("Hubo un error al leer el archivo CSV.");
            resolve({ valid: false });
          },
        });
      } else if (extension === "xlsx" || extension === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: "array" });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];

            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = (json[0] as string[]) || [];

            const report = validateHeaders(headers);
            if (!report.isValid) {
              resolve({ valid: false, report });
              return;
            }

            const jsonData = XLSX.utils.sheet_to_json(worksheet, {
              defval: "",
              raw: true,
            }) as Record<string, unknown>[];
            let hasOrphans = false;
            let missingIssueCount = 0;
            let missingIdCount = 0;

            if (!report.matchedIssueColumn) {
              missingIssueCount = jsonData.length;
              hasOrphans = jsonData.length > 0;
            } else {
              jsonData.forEach((row) => {
                if (
                  !row[report.matchedIssueColumn!] ||
                  String(row[report.matchedIssueColumn!]).trim() === ""
                ) {
                  missingIssueCount++;
                  hasOrphans = true;
                }
              });
            }

            if (!report.matchedIdColumn) {
              missingIdCount = jsonData.length;
            } else {
              jsonData.forEach((row) => {
                if (
                  !row[report.matchedIdColumn!] ||
                  String(row[report.matchedIdColumn!]).trim() === ""
                ) {
                  missingIdCount++;
                }
              });
            }

            report.totalRows = jsonData.length;
            report.missingIssueCount = missingIssueCount;
            report.missingIdCount = missingIdCount;

            const finalData = jsonData.map((row, idx) => {
              const newRow = { ...row };
              if (!report.matchedIdColumn) {
                newRow.comment_id = `auto-id-${idx + 1}`;
              } else if (
                !newRow[report.matchedIdColumn] ||
                String(newRow[report.matchedIdColumn]).trim() === ""
              ) {
                newRow[report.matchedIdColumn] = `auto-id-${idx + 1}`;
              }
              return newRow;
            });

            resolve({
              valid: true,
              file,
              hasOrphans,
              parsedData: finalData,
              issueColumnName: report.matchedIssueColumn,
              report,
            });
          } catch {
            setError("Hubo un error al leer el archivo Excel.");
            resolve({ valid: false });
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        setError(
          "Formato de archivo no soportado. Sube un CSV o Excel (.xlsx, .xls).",
        );
        resolve({ valid: false });
      }
    });
  };

  const regenerateCsvFile = (
    data: Record<string, unknown>[],
    originalFileName: string,
  ): File => {
    const keys = new Set<string>();
    data.forEach((row) => {
      Object.keys(row).forEach((key) => keys.add(key));
    });

    const csv = Papa.unparse(data, {
      columns: Array.from(keys),
    });
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const newName =
      originalFileName.replace(/\.(xlsx|xls|csv)$/i, "") + "_prc.csv";
    return new File([blob], newName, { type: "text/csv" });
  };

  return {
    processFile,
    regenerateCsvFile,
    error,
    setError,
    clearError: () => setError(null),
  };
};
