"use client";

import { useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InvoiceDownloadProps {
  paymentId: string;
  date: string;
  amount: number;
  description: string;
  status: string;
  plan: string;
}

function formatInvoiceDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateInvoiceNumber(paymentId: string, date: string) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const suffix = paymentId.replace(/-/g, "").slice(-6).toUpperCase();
  return `INV-${yyyy}${mm}-${suffix}`;
}

export function InvoiceDownload({
  paymentId,
  date,
  amount,
  description,
  status,
  plan,
}: InvoiceDownloadProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const invoiceNumber = generateInvoiceNumber(paymentId, date);
  const formattedDate = formatInvoiceDate(date);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNumber}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              padding: 40px;
              color: #111;
              max-width: 700px;
              margin: 0 auto;
            }
            .header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 40px;
              border-bottom: 2px solid #111;
              padding-bottom: 20px;
            }
            .logo {
              font-size: 24px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            .invoice-meta {
              text-align: right;
              font-size: 14px;
              color: #555;
            }
            .invoice-meta strong {
              display: block;
              font-size: 16px;
              color: #111;
              margin-bottom: 4px;
            }
            .details {
              margin-bottom: 30px;
            }
            .details p {
              margin: 4px 0;
              font-size: 14px;
              color: #555;
            }
            .details p strong {
              color: #111;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            th {
              text-align: left;
              padding: 10px 12px;
              border-bottom: 1px solid #ddd;
              font-size: 12px;
              text-transform: uppercase;
              color: #777;
              letter-spacing: 0.5px;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #eee;
              font-size: 14px;
            }
            .amount {
              text-align: right;
              font-weight: 600;
            }
            .total-row td {
              border-top: 2px solid #111;
              border-bottom: none;
              font-weight: 700;
              font-size: 16px;
              padding-top: 16px;
            }
            .status {
              display: inline-block;
              padding: 2px 10px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
            }
            .status-paid { background: #dcfce7; color: #166534; }
            .status-pending { background: #fef9c3; color: #854d0e; }
            .status-failed { background: #fecaca; color: #991b1b; }
            .status-refunded { background: #e5e7eb; color: #374151; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              font-size: 12px;
              color: #999;
              text-align: center;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">ClawHQ</div>
            <div class="invoice-meta">
              <strong>${invoiceNumber}</strong>
              ${formattedDate}
            </div>
          </div>

          <div class="details">
            <p><strong>Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</p>
            <p><strong>Status:</strong> <span class="status status-${status}">${status.charAt(0).toUpperCase() + status.slice(1)}</span></p>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align:right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${description}</td>
                <td class="amount">$${Number(amount).toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>Total</td>
                <td class="amount">$${Number(amount).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            ClawHQ &mdash; Managed OpenClaw Hosting<br />
            support@clawhq.tech
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handlePrint}
        title={`Download invoice ${invoiceNumber}`}
        aria-label={`Download invoice ${invoiceNumber}`}
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
      <div ref={printRef} className="hidden" />
    </>
  );
}
