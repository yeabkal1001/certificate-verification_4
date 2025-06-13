import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';
import { BulkUploadForm } from '../components/bulk-upload-form';

// Helper to create a mock CSV file
function createMockCsvFile(content = 'certificateId,recipientName,courseName,issueDate,issuer,grade\nCERT-2025-0001,John Doe,Course 1,2025-06-01,IMS Certify,A+') {
  return new File([content], 'test.csv', { type: 'text/csv' });
}

describe('BulkUploadForm', () => {
  it('renders without crashing', () => {
    render(<BulkUploadForm onClose={jest.fn()} />);
    expect(screen.getByTestId('bulk-upload-form')).toBeInTheDocument();
    expect(screen.getByText(/CSV File Upload/i)).toBeInTheDocument();
    expect(screen.getByTestId('template-select')).toBeInTheDocument();
    expect(screen.getByTestId('download-template-btn')).toBeInTheDocument();
    expect(screen.getByTestId('csv-file-input')).toBeInTheDocument();
    expect(screen.getByTestId('upload-btn')).toBeInTheDocument();
  });

  it('shows validation errors if required fields are missing', async () => {
    render(<BulkUploadForm onClose={jest.fn()} />);
    fireEvent.click(screen.getByTestId('upload-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('template-error')).toBeInTheDocument();
      expect(screen.getByTestId('file-error')).toBeInTheDocument();
    });
  });

  it('accepts a CSV file and parses it (shows preview)', async () => {
    render(<BulkUploadForm onClose={jest.fn()} />);
    const fileInput = screen.getByTestId('csv-file-input');
    const file = createMockCsvFile();
    fireEvent.change(fileInput, { target: { files: [file] } });
    // Wait for preview table to show up
    await waitFor(() => {
      expect(screen.getByText(/Preview Data:/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/CERT-2025-0001/i)).toBeInTheDocument();
    });
  });

  it('submits the form with valid data', async () => {
    const onCertificatesAdded = jest.fn();
    const onClose = jest.fn();
    render(<BulkUploadForm onClose={onClose} onCertificatesAdded={onCertificatesAdded} />);
    // Select template
    fireEvent.change(screen.getByTestId('template-select'), { target: { value: 'template_1' } });
    // Upload file
    const file = createMockCsvFile();
    fireEvent.change(screen.getByTestId('csv-file-input'), { target: { files: [file] } });
    // Wait for preview
    await waitFor(() => expect(screen.getByText(/John Doe/i)).toBeInTheDocument());
    // Submit
    fireEvent.click(screen.getByTestId('upload-btn'));
    // Wait for simulated API call
    await waitFor(() => expect(onCertificatesAdded).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ recipientName: 'John Doe', certificateId: expect.any(String) })
      ])
    ), { timeout: 4000 });
    expect(onClose).toHaveBeenCalled();
  });
});
