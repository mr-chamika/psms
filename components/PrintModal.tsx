'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import { formatPrice } from '@/lib/utils';
import {
    LIST_PAGE_HEADER_ACTION,
    LIST_PAGE_HEADER_CANCEL,
    LIST_PAGE_SUCCESS_ACTION,
} from '@/lib/list-page-styles';

type StudioInfo = { studioName: string; email: string; phone: string; address: string };

interface OrderDetails {
    orderId: string;
    date: string;
    orderNumber: string;
    clientName: string;
    telephone: string;
    status: string;
    receiptNumber?: string;
    totalAmount: number;
    advance: number;
    totalDiscount: number;
    balance: number;
    paymentMethod?: string;
    items: any[];
}

interface PrintModalProps {
    show: boolean;
    setShow: (show: boolean) => void;
    order: OrderDetails | null;
}

export default function PrintModal({ show, setShow, order }: PrintModalProps) {
    const [isPrinting, setIsPrinting] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [includeLogo, setIncludeLogo] = useState(true);
    const [studioInfo, setStudioInfo] = useState<StudioInfo>({ studioName: '', email: '', phone: '', address: '' });

    useEffect(() => {
        fetch('/api/settings/studio')
            .then(r => r.json())
            .then(data => {
                if (data && !data.error) {
                    setStudioInfo({
                        studioName: data.studioName ?? '',
                        email: data.email ?? '',
                        phone: data.phone ?? '',
                        address: data.address ?? '',
                    });
                }
            });
    }, []);

    if (!order) return null;

    const generateInvoiceHTML = () => {
        return `
            <div class="header">
                <div class="header-left">
                    ${includeLogo ? `<h2>📷 ${studioInfo.studioName || 'Studio'}</h2>` : ''}
                    <p>Professional Photography Services</p>
                    ${studioInfo.phone ? `<p>Phone: ${studioInfo.phone}</p>` : ''}
                    ${studioInfo.email ? `<p>Email: ${studioInfo.email}</p>` : ''}
                </div>
                <div class="header-right">
                    <h1>INVOICE</h1>
                    <p><strong>Invoice #:</strong> ${order.receiptNumber || order.orderNumber}</p>
                    <p><strong>Date:</strong> ${order.date}</p>
                </div>
            </div>
            
            <div class="bill-to">
                <div class="bill-to-section">
                    <h3>Bill To</h3>
                    <p class="client-name">${order.clientName}</p>
                    <p>Phone: ${order.telephone}</p>
                    <p>Order ID: ${order.orderNumber}</p>
                </div>
                <div class="bill-to-section" style="text-align: right;">
                    <h3>Order Details</h3>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Mixed'}</p>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Description</th>
                        <th class="center">Qty</th>
                        <th class="right">Amount (LKR)</th>
                        <th class="right">Discount (LKR)</th>
                        <th class="right">Total (LKR)</th>
                    </tr>
                </thead>
                <tbody>
                    ${order.items && order.items.length > 0 ?
                order.items.map((item) => `
                            <tr>
                                <td>${item.item || item.type || '-'}</td>
                                <td>${item.type || item.item || '-'}</td>
                                <td class="center">${item.qty || '-'}</td>
                                <td class="right">${item.amountLKR ? formatPrice(item.amountLKR) : formatPrice(0)}</td>
                                <td class="right">${item.discountLKR ? formatPrice(item.discountLKR) : formatPrice(0)}</td>
                                <td class="right bold">${item.amountLKR ? formatPrice(item.amountLKR - (item.discountLKR || 0)) : formatPrice(0)}</td>
                            </tr>
                        `).join('')
                : '<tr><td colspan="6" style="text-align: center;">No items</td></tr>'
            }
                </tbody>
            </table>
            
            <div class="summary">
                <div class="summary-box">
                    <div class="summary-row">
                        <span class="summary-label">Subtotal:</span>
                        <span class="summary-value">LKR ${formatPrice(order.totalAmount)}</span>
                    </div>
                    <div class="summary-row discount">
                        <span class="summary-label">Total Discount:</span>
                        <span class="summary-value">-LKR ${formatPrice(order.totalDiscount)}</span>
                    </div>
                    <div class="summary-row advance">
                        <span class="summary-label">Advance Paid:</span>
                        <span class="summary-value">-LKR ${formatPrice(order.advance)}</span>
                    </div>
                    <div class="summary-row total">
                        <span class="summary-label">Balance Due:</span>
                        <span class="summary-value">LKR ${formatPrice(order.balance)}</span>
                    </div>
                </div>
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>${studioInfo.studioName || 'Studio'} - Professional Photography Services</p>
                ${studioInfo.email || studioInfo.phone ? `<p>For inquiries, please contact us at ${[studioInfo.email, studioInfo.phone].filter(Boolean).join(' or ')}</p>` : ''}
            </div>
        `;
    };

    const getFullHTML = (invoiceHTML: string) => {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Invoice ${order.orderNumber}</title>
                <style>
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    html, body {
                        width: 100%;
                        height: 100%;
                        background: white;
                    }
                    
                    body {
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                        line-height: 1.5;
                        color: #333;
                    }
                    
                    .invoice-container {
                        width: 210mm;
                        height: 297mm;
                        padding: 20mm;
                        margin: 0 auto;
                        background: white;
                    }
                    
                    @media print {
                        .invoice-container {
                            width: 100%;
                            height: auto;
                            padding: 0;
                            margin: 0;
                        }
                    }
                    
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        margin-bottom: 30px;
                        padding-bottom: 20px;
                        border-bottom: 3px solid #333;
                    }
                    
                    .header-left h2 {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    
                    .header-left p {
                        font-size: 12px;
                        margin: 3px 0;
                    }
                    
                    .header-right {
                        text-align: right;
                    }
                    
                    .header-right h1 {
                        font-size: 32px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    
                    .header-right p {
                        font-size: 12px;
                        margin: 3px 0;
                    }
                    
                    .bill-to {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 30px;
                        margin-bottom: 30px;
                    }
                    
                    .bill-to-section h3 {
                        font-size: 11px;
                        font-weight: 900;
                        margin-bottom: 10px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                    }
                    
                    .bill-to-section p {
                        font-size: 12px;
                        margin: 3px 0;
                    }
                    
                    .bill-to-section .client-name {
                        font-weight: bold;
                        font-size: 14px;
                        margin-bottom: 5px;
                    }
                    
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 20px;
                        font-size: 12px;
                    }
                    
                    table thead tr {
                        border-top: 2px solid #333;
                        border-bottom: 2px solid #333;
                    }
                    
                    table th {
                        padding: 10px;
                        text-align: left;
                        font-weight: bold;
                        color: #000;
                    }
                    
                    table th.right {
                        text-align: right;
                    }
                    
                    table th.center {
                        text-align: center;
                    }
                    
                    table td {
                        padding: 8px 10px;
                        border-bottom: 1px solid #ddd;
                    }
                    
                    table td.right {
                        text-align: right;
                    }
                    
                    table td.center {
                        text-align: center;
                    }
                    
                    table td.bold {
                        font-weight: bold;
                    }
                    
                    .summary {
                        display: flex;
                        justify-content: flex-end;
                        margin-bottom: 20px;
                    }
                    
                    .summary-box {
                        width: 300px;
                    }
                    
                    .summary-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #ddd;
                        font-size: 12px;
                    }
                    
                    .summary-row.total {
                        border-top: 2px solid #ddd;
                        border-bottom: 2px solid #fcd34d;
                        background-color: #fef3c7;
                        padding: 10px;
                        font-weight: 900;
                        font-size: 14px;
                    }
                    
                    .summary-label {
                        color: #333;
                        font-weight: 500;
                    }
                    
                    .summary-value {
                        color: #000;
                        font-weight: bold;
                    }
                    
                    .summary-row.discount .summary-value {
                        color: #dc2626;
                    }
                    
                    .summary-row.advance .summary-value {
                        color: #16a34a;
                    }
                    
                    .footer {
                        text-align: center;
                        padding-top: 20px;
                        border-top: 2px solid #ddd;
                        font-size: 11px;
                        color: #666;
                    }
                    
                    .status-badge {
                        display: inline-block;
                        background-color: #fef3c7;
                        color: #92400e;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: bold;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    ${invoiceHTML}
                </div>
            </body>
            </html>
        `;
    };

    const handlePrint = async () => {
        setIsPrinting(true);

        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Please allow popup windows to print');
            setIsPrinting(false);
            return;
        }

        // Generate and write HTML
        const invoiceHTML = generateInvoiceHTML();
        const fullHTML = getFullHTML(invoiceHTML);

        printWindow.document.open();
        printWindow.document.write(fullHTML);
        printWindow.document.close();

        // Wait for content to load, then open print dialog
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                setIsPrinting(false);
                setShow(false);
            }, 500);
        };
    };

    const handleDownloadPDF = async () => {
        setIsDownloading(true);

        try {
            // Generate the HTML invoice
            const invoiceHTML = generateInvoiceHTML();
            const fullHTML = getFullHTML(invoiceHTML);

            // Convert HTML to Blob
            const blob = new Blob([fullHTML], { type: 'text/html' });

            // Create a temporary iframe to render PDF
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            // Write HTML to iframe
            const doc = iframe.contentDocument;
            if (doc) {
                doc.open();
                doc.write(fullHTML);
                doc.close();

                // Wait for iframe to load
                setTimeout(() => {
                    try {
                        // Use iframe's print functionality to save as PDF
                        iframe.contentWindow?.print();

                        // Clean up after a delay
                        setTimeout(() => {
                            document.body.removeChild(iframe);
                            setIsDownloading(false);
                            setShow(false);
                        }, 1000);
                    } catch (error) {
                        console.error('Error:', error);
                        document.body.removeChild(iframe);
                        setIsDownloading(false);
                    }
                }, 500);
            }
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Error generating PDF');
            setIsDownloading(false);
        }
    };

    return (
        <Modal show={show} setShow={setShow}>
            <div className="bg-white rounded-2xl p-8 shadow-lg max-w-2xl w-full mx-4 max-h-[95vh] overflow-y-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Print Invoice</h1>
                    <p className="text-gray-500">Order: <strong>{order.orderNumber}</strong> - Client: <strong>{order.clientName}</strong></p>
                </div>

                {/* Logo Option */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="flex items-center gap-3 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeLogo}
                            onChange={(e) => setIncludeLogo(e.target.checked)}
                            className="w-5 h-5 rounded border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-gray-900">Include Logo in Print</span>
                    </label>
                </div>

                {/* Preview */}
                <div className="mb-6 border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    <div className="max-h-96 overflow-y-auto p-4 bg-white">
                        <div className="text-center text-gray-500 text-sm">
                            <p className="mb-2">📄 Professional Invoice Layout</p>
                            <p className="text-xs">Studio Logo • Client Details • Order Items • Financial Summary</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center">
                    <button
                        type="button"
                        onClick={() => setShow(false)}
                        disabled={isPrinting || isDownloading}
                        className={`${LIST_PAGE_HEADER_CANCEL} w-full appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleDownloadPDF}
                        disabled={isPrinting || isDownloading}
                        className={`${LIST_PAGE_SUCCESS_ACTION} w-full appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
                    >
                        {isDownloading ? (
                            <>
                                <svg width="20px" height="20px" className="animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25"></circle>
                                    <path d="M12 2a10 10 0 0 1 0 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                </svg>
                                Downloading...
                            </>
                        ) : (
                            <>
                                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2v12m0 0l-3-3m3 3l3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                    <path d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                </svg>
                                Download PDF
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={handlePrint}
                        disabled={isPrinting || isDownloading}
                        className={`${LIST_PAGE_HEADER_ACTION} w-full appearance-none whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
                    >
                        {isPrinting ? (
                            <>
                                <svg width="20px" height="20px" className="animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25"></circle>
                                    <path d="M12 2a10 10 0 0 1 0 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                </svg>
                                Printing...
                            </>
                        ) : (
                            <>
                                <svg width="20px" height="20px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6 9V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                    <path d="M4 9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"></path>
                                </svg>
                                Print Invoice
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
}