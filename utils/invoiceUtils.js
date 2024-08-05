const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const createInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, '..', 'invoices');
      const invoicePath = path.join(invoiceDir, `Invoice_${order.orderID}.pdf`);

      // Check if the invoices directory exists, if not, create it
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }

      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(invoicePath);

      doc.pipe(writeStream);

      doc.fontSize(20).text('Invoice', { align: 'center' });
      doc.text(`Order ID: ${order.orderID}`);
      doc.text(`Customer: ${order.userId.firstName} ${order.userId.lastName}`);
      doc.text(`Email: ${order.userId.email}`);
      doc.text(`Phone: ${order.userId.phone}`);
      doc.text('Order Details:');
      order.orderItems.forEach(item => {
        if (item.productId) {
          doc.text(`- ${item.productId.productName}: ${item.quantity} x $${item.productId.price}`);
        } else {
          console.error('Product is undefined for item:', item);
        }
      });
      doc.text(`Total Amount: $${order.totalAmount}`);

      doc.end();

      writeStream.on('finish', () => {
        resolve(invoicePath);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = { createInvoice };
