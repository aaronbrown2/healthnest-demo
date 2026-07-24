/**
 * AI-USAGE SUMMARY
 * Tools: Opus 4.7
 * Overall AI Contribution: ~65%
 * AI-Assisted Areas: Wrote the drag-and-drop file zone, the file size formatter, the staged-file pre-load via the initialFile prop, and the modal markup using the shared lab-modal-* class vocabulary.
 * Human Contributions: Decided to remove the source-format dropdown in favor of backend auto-detect, wired the PatientTypeahead, and shaped the success flow to immediately route into the review screen.
 */
import { useState } from "react";
import { Upload, X, FileText } from "lucide-react";
import { labResultsApi } from "../lib/labResultsApi";
import PatientTypeahead from "../patient/PatientTypeahead";
import "./labResults.css";

const MAX_LAB_UPLOAD_BYTES = 25 * 1024 * 1024;
const LAB_FILE_ACCEPT =
  ".hl7,.txt,.json,.xml,application/json,application/fhir+json,application/xml,text/xml,application/fhir+xml,text/plain";
const SUPPORTED_LAB_EXTENSIONS = new Set(["hl7", "txt", "json", "xml"]);

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function validateLabFile(file) {
  if (!file) return null;
  if (file.size === 0) return "Choose a non-empty lab result file.";
  if (file.size > MAX_LAB_UPLOAD_BYTES) {
    return "Lab result files must be 25 MB or smaller.";
  }

  const extension = file.name.toLowerCase().split(".").pop();
  if (!SUPPORTED_LAB_EXTENSIONS.has(extension)) {
    return "HealthNest accepts HL7 v2, FHIR JSON, or FHIR XML files in this demo.";
  }
  return null;
}

export default function LabResultUploadModal({
  onClose,
  onUploaded,
  initialFile = null,
}) {
  const [file, setFile] = useState(initialFile);
  const [patient, setPatient] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(() => validateLabFile(initialFile));

  const fileError = validateLabFile(file);
  const valid = !!file && !!patient && !fileError;

  function pickFile(nextFile) {
    setFile(nextFile);
    setError(validateLabFile(nextFile));
  }

  async function handleSubmit() {
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const detail = await labResultsApi.upload({
        file,
        patientId: patient.id,
      });
      onUploaded(detail);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function onDrop(ev) {
    ev.preventDefault();
    setDragging(false);
    const f = ev.dataTransfer?.files?.[0];
    if (f) pickFile(f);
  }

  return (
    <div
      className='lab-modal-backdrop'
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
      <div className='lab-modal'>
        <div className='lab-modal-header'>
          <h3 className='lab-modal-title'>Upload lab result</h3>
          <button
            className='lab-modal-close'
            onClick={onClose}
            aria-label='Close'>
            <X size={18} />
          </button>
        </div>

        <div className='lab-modal-body'>
          <label
            className={`lab-dropzone ${dragging ? "drag" : ""} ${
              file ? "picked" : ""
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}>
            {file ? (
              <>
                <FileText size={20} className='lab-dropzone-icon' />
                <div>
                  <div className='lab-dropzone-name'>{file.name}</div>
                  <div className='lab-dropzone-size'>
                    {formatBytes(file.size)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <Upload size={22} style={{ marginBottom: 8 }} />
                <div>
                  <strong>Drop a file</strong> or click to browse
                </div>
                <div className='lab-field-hint' style={{ marginTop: 4 }}>
                  HL7 v2, FHIR JSON, or FHIR XML
                </div>
              </>
            )}
            <input
              type='file'
              accept={LAB_FILE_ACCEPT}
              style={{ display: "none" }}
              onChange={(e) => pickFile(e.target.files?.[0] || null)}
            />
          </label>

          <div className='lab-field'>
            <label>Patient</label>
            <PatientTypeahead value={patient} onChange={setPatient} />
            <span className='lab-field-hint'>
              Only patients with an active care-team relationship to you appear here.
            </span>
          </div>

          {error && (
            <div className='lab-banner lab-banner-danger'>{error}</div>
          )}
        </div>

        <div className='lab-modal-footer'>
          <button className='lab-btn' onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            className='lab-btn lab-btn-primary'
            disabled={!valid || submitting}
            onClick={handleSubmit}>
            {submitting ? (
              <>
                <span className='lab-spinner' /> Uploading…
              </>
            ) : (
              <>
                <Upload size={14} /> Upload & review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
