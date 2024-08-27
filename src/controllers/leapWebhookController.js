const handleWebhook = async (req, res) => {
    try {
      const notifications = req.body; // Webhook payload
      
      // Process each notification
      for (const notification of notifications) {
        switch (notification.action) {
          case 'customers':
            if (notification.operation === 'create') {
              // Handle customer creation
              console.log(`Customer created with ID: ${notification.id}`);
              // Fetch customer details from Leap and store in your DB
            }
            break;
          case 'jobs':
            if (notification.operation === 'create') {
              // Handle job creation
              console.log(`Job created with ID: ${notification.id}`);
              // Fetch job details from Leap and store in your DB
            } else if (notification.operation === 'stage_change') {
              // Handle job stage change
              console.log(`Job ID: ${notification.id} changed from ${notification.stage_moved_from.name} to ${notification.stage_moved_to.name}`);
              // Update job stage in your DB
            }
            break;
          default:
            console.warn('Unknown action:', notification.action);
        }
      }
  
      // Respond with 200 OK to acknowledge receipt
      res.status(200).send('Webhook received');
    } catch (error) {
      console.error('Error handling webhook:', error);
      res.status(500).send('Error handling webhook');
    }
  };
  
  module.exports = { handleWebhook };
  