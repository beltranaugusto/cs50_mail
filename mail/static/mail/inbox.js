document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views

  // Each email can be clicked to be taken to the body and stuff.
  
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit email
  // Creating a constant that holds the email form
  const form = document.querySelector('#compose-form')
  // On submit, the fetch occurs. We pass it a javascript object (it is like a dictionary.)
  // It has two items, method, which holds the corresponding method of the request.
  // And body, which holds another javascript object that has 3 items corresponding to the data we are receiving from the API.
  form.onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value.toLowerCase(),
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value,
      })
    })
    // Then, we convert the response to a json
    .then(response => response.json())
    // Depending on the response we get, different scenarios may occur.
    .then(result => {

        // The #recipients-error element gets a class that hides it at the beggining, we don't want the error box showing up if we don't have any errors.
        document.querySelector('#recipients-error').classList.add('hidden')

        // If there is indeed an error, the inner HTML of #recipients-error gets filled with the error
        // Then, the .hidden class gets removed, because we want to show the error box with the message.
        if (result.error) {
          document.querySelector('#recipients-error').innerHTML = result.error;
          document.querySelector('#recipients-error').classList.remove('hidden')
        }

        // If there is a message, in this case the success message, #compose-success changes it inner HTML to whichever message from the API receives.
        // Then, the .hidden class gets removed, because we want to show the message.
        if (result.message) {
          document.querySelector('#compose-success').innerHTML = result.message;
          document.querySelector('#compose-success').classList.remove('hidden')
        }

        // Debugging message.
        console.log(result);
    })

    load_mailbox('inbox');
  }

  // By default, load the inbox
  load_mailbox('inbox');

});

function compose_email() {

  document.querySelector('#compose-success').classList.add('hidden')
  document.querySelector('#recipients-error').classList.add('hidden')

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-body').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Just after this function runs, it does a fetch to the API to get the emails of the corresponding mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
  
    // For each email that the client receives from the API, things will happen.
    emails.forEach(email => {

      // Okay, the idea is that there is a table that shows a row for each email that there is.
      // The table is already created. A row needs to be created for each email, each one having 4 columns with the information of the email.
      // Last, there will be an hidden input with the id of the email, this is done so when we request the API for the body and stuff of the email, we can access it with the id.
      
      // Creating the row and setting its id for later reference.
      const email_row = document.createElement("tr");
      email_row.id = "#email-row";

      // Creating the hidden input, setting its value, and appending it to the row.
      const email_row_value = document.createElement("input");
      email_row_value.hidden = true;
      email_row.append(email_row_value);
      email_row_value.id = "email-row-value"
      email_row_value.setAttribute('value', email.id);

      // Creating the 4 columns.
      //const id_col = document.createElement("th");
      const subject_col = document.createElement("td");
      const sender_col = document.createElement("td");
      const timestamp_col = document.createElement("td");

      // Setting the inner HTML of the columns.
      //id_col.innerHTML = email.id;
      subject_col.innerHTML = email.subject;
      sender_col.innerHTML = email.sender;
      timestamp_col.innerHTML = email.timestamp;

      // Appending the columns to the row
      //email_row.append(id_col);
      email_row.append(subject_col);
      email_row.append(sender_col);
      email_row.append(timestamp_col);

      // Appending the row to the table body
      document.querySelector("#emails-body").append(email_row);

      // If the email has been read, the style of the row should change.
      // IMPORTANT: When u send an email, it counts as like you read it already. Meaning, an email that you send is an email that you read.
      // Ex: If u send an email to yourself, when u get it, it will appear as like you read it already because you sent it.
      // It is working as intended. It's just I got things confused because I was testing this by sending emails from an adress to the same adress so, I thought it was not working as intended.
      if (email.read === true) {
        email_row.classList.add("table-success")
        console.log("wawa")
      }


      // EMAIL LOAD
      email_row.onclick = function() {

        // When a email is clicked, it means that it has been read. A fetch is done to change the property of a specific email of read to true
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        }); 

        // When a email is clicked, the page should change to show a different view, with the body of the email. Everything else should be hid.
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {
            // Print email
            console.log(email.body);
            // Filling the email view
            document.querySelector("#card-header").innerHTML = `From: ${email.sender}`;
            document.querySelector("#card-title").innerHTML = `${email.subject}`;
            document.querySelector("#card-text").innerHTML = email.body;
            document.querySelector("#card-footer").innerHTML = email.timestamp;

            // Setting the id on the email view for later reference (archive button solution)
            document.querySelector("#email-id").setAttribute('value', email.id);

            document.querySelector('#email-body').style.display = 'block';
            document.querySelector('#emails-view').style.display = 'none';
            document.querySelector('#compose-view').style.display = 'none';

            // Reply
            document.querySelector("#reply-button").onclick = function() { reply(email.sender, email.recipients, email.subject, email.body, email.timestamp) };

            // Archived
            if (!email.archived) {
              document.querySelector("#archive-button").innerHTML = "Archive"
              document.querySelector("#archive-button").classList.remove("btn-danger")
            } else {
              document.querySelector("#archive-button").innerHTML = "Remove from Archive"
              document.querySelector("#archive-button").classList.add("btn-danger")
            }

            });

      }

      // Archive email
      /* document.querySelector("#archive-button").onclick = function() {
        fetch(`/emails/${email.id}`)
        .then(response => response.json())
        .then(email => {
            // Print email
            console.log(email.archive);
            });

      } */

    });

    // I overcomplicated myself with this, I had this error that append was not working on the element I selected (because it literally didn't exist)
    // I thought it was something that had to do with the way I was iterating, but, yeah, it wasn't the case.
    // I'm going to keep this for future reference I guess.

    // for (let key in emails) {
    //   let email = document.createElement('div');
    //   email.innerHTML = `${emails[key].sender} ${emails[key].subject} ${emails[key].timestamp}`;
    //   document.querySelector("#emails-view").append(email);
    //   console.log(key, emails[key]);
    // }

  });

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-body').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `
  <div class="card-header border-bottom-0"> <h3 class="m-4">${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3></div>
  <table class="mb-0 table table-hover">
      <thead>
        <tr>
          <th class="border-bottom-0" scope="col">Subject</th>
          <th class="border-bottom-0" scope="col">Sender</th>
          <th class="border-bottom-0" scope="col">Timestamp</th>
        </tr>
      </thead>
      <tbody id="emails-body">
      </tbody>
    </table>
  `;
}

// UPDATE: I know now why the method .onclick was not working I WAS NOT USING THE PROPER FORMAT
// For some fking reason the method .onclick was not working inside the domloaded function, or on the load_mailbox function. So what I did to make it work was to set the attribute ----
// onclick="archive()" (The name of the function I created with the logic of the archive fetch) on the html button. For some reason I'm don't know, it works like that.
function archive() {
  let email_id = document.querySelector("#email-id").value
  if (document.querySelector("#archive-button").innerHTML === "Archive") {
    fetch(`/emails/${email_id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
    
    load_mailbox('inbox')
    // Legacy code
    /* document.querySelector("#archive-button").innerHTML = "Remove from Archive"
    document.querySelector("#archive-button").classList.add("btn-danger") */
    
  } else {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: false
    })
  })
  
  load_mailbox('inbox')
  /* document.querySelector("#archive-button").innerHTML = "Archive"
  document.querySelector("#archive-button").classList.remove("btn-danger") */

  }
  
}


// This function is kind of a replica of compose_email(), it receives 5 different parameters corresponding to the information of the email to reply.
// It uses thoses variables to fill out the form to reply.
function reply(sender, recipients, subject, body, timestamp) {

  console.log(sender, recipients, subject, body)

  document.querySelector('#compose-success').classList.add('hidden')
  document.querySelector('#recipients-error').classList.add('hidden')

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-body').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = `${sender}`;
  document.querySelector('#compose-subject').value = `${subject}`;
  document.querySelector('#compose-body').value = `On ${timestamp}, ${sender} wrote: "${body}"`;
}