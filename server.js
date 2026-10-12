require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();

app.use(cors());
app.use(express.json());

app.post("/contact", async function(req,res) {
    const name = req.body.name;
    const email = req.body.email;
    const goal = req.body.goal;
    const message = req.body.message;

    if(name === "" || email === "" ||  goal === "" || message ===  "") {
       return res.status(400).json({error: "Please complete all fields to establish a connection."});
   } else {
       try {
         const ownerPayLoad = {
             sender: {name: "Phanura Web Intake", email: "frontenddev1026@gmail.com"},
             to: [{email: "frontenddev1026@gmail.com", name: "Phanura Owner"}],
             subject: "[ALERT] New Lead Intake - Phanura",
             htmlContent: `<html><head></head><body><h2>New Submission</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Goal:</strong> ${goal}</p><p><strong>Message:</strong> ${message}</p></body></html>`
         };

         const visitorPayLoad = {
             sender: {name: "Phanura", email: "frontenddev1026@gmail.com"},
             to: [{email: email, name: name}],
             subject: "Transmission Received | Phanura",
             htmlContent: `<html><head></head><body><h3>Hello ${name},</h3><p>Thank you for reaching out. We have received your transmission regarding ${goal} and will connect with you directly.</p><br/><p><em>Forge your legacy. Elevate your standard.</em></p></body></html>`
         };

         const [ownerResponse, visitorResponse] = await Promise.allSettled([
             fetch("https://api.brevo.com/v3/smtp/email", {
                 method: "POST",
                 headers: {"Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY, "accept": "application/json"},
                 body: JSON.stringify(ownerPayLoad)
             }),
             fetch("https://api.brevo.com/v3/smtp/email", {
                 method: "POST",
                 headers: {"Content-Type": "application/json", "api-key": process.env.BREVO_API_KEY, "accept": "application/json"},
                 body: JSON.stringify(visitorPayLoad)
             })
         ]);

         if(ownerResponse.status === "rejected" || !ownerResponse.value.ok) {
           console.error("Owner Email Failed to dispatch.");
           return res.status(500).json({error: "Connection portal temporarily offline. Please retry shortly."});
         }

         const ownerData = await ownerResponse.value.json(); 

        if(visitorResponse.status === "fulfilled" && visitorResponse.value.ok) {
          const visitorData = await visitorResponse.value.json();
          
          return res.status(200).json({
              success: true,
              message: "Connection request received! Check your inbox for your confirmation.",
              ownerId: ownerData.messageId,
              visitorId: visitorData.messageId
          });
        } else {
             console.warn("Owner received data, but Visitor confirmation email failed to dispatch.");
             return res.status(200).json({
                 success: true,
                 message: "Connection request secure. Our team will reach out directly.",
                 ownerId: ownerData.messageId,
                 visitorWarning: true
             }); 
        }
     } catch(error) {
       console.error("Phanura server is currently down. Please try again later:", error);
       return res.status(500).json({error: "Phanura server is currently down. Please try again later."});
     }
   }
});

app.listen(3000, function() {
    console.log("Phanura server running on port 3000");
});




