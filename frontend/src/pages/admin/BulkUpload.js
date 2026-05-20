// src/pages/admin/BulkUpload.js
import React, { useState, useRef } from "react";
import { bulkUpload } from "../../services/api";
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  PageHeader,
} from "../../components/common/UI";
import { FileUp, CheckCircle, XCircle, Download } from "lucide-react";
import toast from "react-hot-toast";

export default function BulkUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.name.endsWith(".xlsx")) {
      setFile(f);
      setResult(null);
    } else toast.error("Please select a valid .xlsx file");
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file first");
    const formData = new FormData();
    formData.append("file", file);
    setLoading(true);
    try {
      const { data } = await bulkUpload(formData);
      setResult(data);
      toast.success(
        `Upload done: ${data.summary.succeeded} added, ${data.summary.failed} failed`,
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const headers = [
      "first_name",
      "last_name",
      "dob",
      "employee_id",
      "official_email",
      "contact_number",
      "status",
      "role",
    ];
    const rows = [
      [
        "John",
        "Doe",
        "1990-05-15",
        "EMP001",
        "john.doe@company.com",
        "9876543210",
        "probation",
        "employee",
      ],
      [
        "Jane",
        "Smith",
        "1988-03-22",
        "TL001",
        "jane.smith@company.com",
        "9876543211",
        "permanent",
        "tech_lead",
      ],
      [
        "Sam",
        "Kumar",
        "1985-11-10",
        "HR001",
        "sam.kumar@company.com",
        "9876543212",
        "permanent",
        "hr",
      ],
    ];
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "employee_bulk_template.csv";
    a.click();
  };

  return (
    <div>
      <PageHeader
        title="Bulk Upload"
        subtitle="Import employees, Tech Leads, and HR from a single Excel file"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="Upload Excel File (.xlsx)" />
          <CardBody className="space-y-5">
            <div
              onClick={() => inputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <FileUp className="mx-auto text-slate-400 mb-3" size={36} />
              <p className="font-medium text-slate-600">
                Click to select .xlsx file
              </p>
              <p className="text-sm text-slate-400 mt-1">Max 5MB</p>
              {file && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <CheckCircle size={14} /> {file.name}
                </div>
              )}
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                loading={loading}
                disabled={!file}
                className="flex-1"
              >
                <FileUp size={16} /> Upload & Import
              </Button>
              <Button variant="outline" onClick={downloadTemplate}>
                <Download size={16} /> Template
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Required Excel Columns"
            subtitle="Must have all 8 columns with exact header names"
          />
          <CardBody>
            <div className="space-y-2 mb-5">
              {[
                { col: "first_name", desc: "First name" },
                { col: "last_name", desc: "Last name" },
                { col: "dob", desc: "Date of birth (YYYY-MM-DD)" },
                {
                  col: "employee_id",
                  desc: "Unique ID (e.g. EMP001, TL001, HR001)",
                },
                { col: "official_email", desc: "Unique work email address" },
                { col: "contact_number", desc: "Phone number" },
                { col: "status", desc: "probation or permanent" },
                {
                  col: "role",
                  desc: (
                    <span>
                      <code className="bg-green-100 text-green-700 px-1 rounded">
                        employee
                      </code>
                      {" · "}
                      <code className="bg-blue-100 text-blue-700 px-1 rounded">
                        tech_lead
                      </code>
                      {" · "}
                      <code className="bg-rose-100 text-rose-700 px-1 rounded">
                        hr
                      </code>
                    </span>
                  ),
                },
              ].map(({ col, desc }) => (
                <div
                  key={col}
                  className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg"
                >
                  <code className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-mono shrink-0">
                    {col}
                  </code>
                  <span className="text-sm text-slate-600">{desc}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                🌹 <strong>HR:</strong> Only 1 HR account is allowed. If HR row
                already exists, it will be skipped.
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                🔑 <strong>Passwords:</strong> A unique random password is
                generated for each account and emailed to them. They can change
                it after login.
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {result && (
        <Card className="mt-6">
          <CardHeader
            title="Upload Results"
            subtitle={`Total: ${result.summary.total} |  Success: ${result.summary.succeeded} | ❌ Failed: ${result.summary.failed}`}
          />
          <CardBody>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-slate-700">
                  {result.summary.total}
                </p>
                <p className="text-sm text-slate-500">Total Rows</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-green-600">
                  {result.summary.succeeded}
                </p>
                <p className="text-sm text-slate-500">Imported</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <p className="text-2xl font-bold text-red-600">
                  {result.summary.failed}
                </p>
                <p className="text-sm text-slate-500">Failed</p>
              </div>
            </div>

            {result.successRows?.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                  <CheckCircle size={15} /> Successfully imported
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.successRows.map((id, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-green-50 border border-green-200 text-green-700 rounded-full text-xs font-medium"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.failedRows?.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                  <XCircle size={15} /> Failed rows
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {result.failedRows.map((row, i) => (
                    <div
                      key={i}
                      className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm"
                    >
                      <p className="font-medium text-red-700">
                        Row {row.row || i + 2}:{" "}
                        {row.data?.employee_id ||
                          row.data?.employeeId ||
                          "Unknown"}
                      </p>
                      <ul className="mt-1 list-disc list-inside text-xs text-red-600">
                        {row.errors?.map((e, j) => (
                          <li key={j}>{e}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
