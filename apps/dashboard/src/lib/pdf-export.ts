/**
 * PDF Export Utility — uses window.print() with print-specific styling.
 *
 * The browser's "Save as PDF" dialog handles PDF conversion.
 * No jsPDF or html2canvas dependencies needed.
 */

/**
 * Show the selected report in a print-friendly layout and trigger window.print().
 * The report element is moved into view with print-optimized styling,
 * then moved back after printing.
 */
export function generatePdf(element: HTMLElement, _filename: string): void {
  console.log('[PDF] Starting print-based generation...');

  // Create a print container that will be the only thing visible during print
  const printContainer = document.createElement('div');
  printContainer.id = 'pravado-print-container';

  // Clone the report content into the print container
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'static';
  clone.style.left = 'auto';
  clone.style.top = 'auto';
  printContainer.appendChild(clone);

  // Inject print styles
  const printStyle = document.createElement('style');
  printStyle.id = 'pravado-print-style';
  printStyle.textContent = `
    @media print {
      body > *:not(#pravado-print-container) {
        display: none !important;
      }
      #pravado-print-container {
        display: block !important;
        position: static !important;
      }
      #pravado-print-container * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @page {
        margin: 12mm;
        size: A4;
      }
    }
  `;

  document.head.appendChild(printStyle);
  document.body.appendChild(printContainer);

  // Trigger print dialog — browser handles "Save as PDF"
  window.print();

  // Cleanup after print dialog closes
  document.body.removeChild(printContainer);
  document.head.removeChild(printStyle);

  console.log('[PDF] Print dialog closed');
}
