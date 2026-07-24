/*
 * AI-usage: 40% (tool: Claude; helped with mock setup,render setup, and basic test structure)
 * Human code: 60% (Chose the test cases, adjusted the test logic, expected values, and checked them against the actual
 * LabResultUploadModal behavior)
 */

import { render, screen, fireEvent } from "@testing-library/react";
import LabResultUploadModal from "../labresults/LabResultUploadModal";

jest.mock("../lib/labResultsApi", () => ({
  labResultsApi: {
    upload: jest.fn(),
  },
}));

jest.mock("../patient/PatientTypeahead", () => {
  return function MockPatientTypeahead({ onChange }) {
    return (
      <button
        data-testid='patient-typeahead'
        onClick={() =>
          onChange({ id: "p-1", first_name: "John", last_name: "Doe" })
        }>
        Select Patient
      </button>
    );
  };
});

import { labResultsApi } from "../lib/labResultsApi";

describe("LabResultUploadModal", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Modal title test
  test("shows the Upload lab result title", () => {
    render(<LabResultUploadModal onClose={jest.fn()} onUploaded={jest.fn()} />);

    expect(screen.getByText("Upload lab result")).toBeInTheDocument();
  });

  // File drop instruction test
  test("shows the file drop instructions", () => {
    render(<LabResultUploadModal onClose={jest.fn()} onUploaded={jest.fn()} />);

    expect(screen.getByText("Drop a file")).toBeInTheDocument();
  });

  // Modal action buttons test
  test("shows the Cancel and Upload buttons", () => {
    render(<LabResultUploadModal onClose={jest.fn()} onUploaded={jest.fn()} />);

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Upload & review")).toBeInTheDocument();
  });

  // Required fields validation test
  test("keeps the Upload button disabled when required fields are missing", () => {
    render(<LabResultUploadModal onClose={jest.fn()} onUploaded={jest.fn()} />);

    const uploadButton = screen.getByText("Upload & review");

    expect(uploadButton).toBeDisabled();
  });

  // Cancel button test
  test("calls onClose when the Cancel button is clicked", () => {
    const onClose = jest.fn();

    render(<LabResultUploadModal onClose={onClose} onUploaded={jest.fn()} />);

    fireEvent.click(screen.getByText("Cancel"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // Close icon test
  test("calls onClose when the close button is clicked", () => {
    const onClose = jest.fn();

    render(<LabResultUploadModal onClose={onClose} onUploaded={jest.fn()} />);

    fireEvent.click(screen.getByLabelText("Close"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("rejects unsupported demo upload file types", () => {
    const { container } = render(
      <LabResultUploadModal onClose={jest.fn()} onUploaded={jest.fn()} />,
    );
    const input = container.querySelector("input[type='file']");
    const file = new File(["hello"], "cover-letter.pdf", {
      type: "application/pdf",
    });

    fireEvent.change(input, { target: { files: [file] } });
    fireEvent.click(screen.getByTestId("patient-typeahead"));

    expect(
      screen.getByText(
        "HealthNest accepts HL7 v2, FHIR JSON, or FHIR XML files in this demo.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Upload & review")).toBeDisabled();
    expect(labResultsApi.upload).not.toHaveBeenCalled();
  });
});
