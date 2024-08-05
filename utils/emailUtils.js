const nodemailer = require('nodemailer');


async function sendInvoiceEmail(order, invoicePath) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'hussainnhussain023@gmail.com',
            pass: 'brus awnb heja eoyn'
        }
    });
  
    let mailOptions = {
        from: 'hussainnhussain023@gmail.com',
        to: order.userId.email,
        subject: 'Your Order Has Been Approved',
        // text: `Dear ${order.userId.firstName},\n\nYour order with ID ${order.orderID} has been approved. Please find the attached invoice for your order.\n\nThank you for shopping with us.`,
        // attachments: [
        //     {
        //         filename: `Invoice_${order.orderID}.pdf`,
        //         path: invoicePath
        //     }
      //  ]
    };this 
  
    return transporter.sendMail(mailOptions);
  }
  

  module.exports={sendInvoiceEmail};
  