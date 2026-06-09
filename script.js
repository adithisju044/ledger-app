let contacts = JSON.parse(localStorage.getItem("contacts")) || [];
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let editId = null;
document.getElementById("date").valueAsDate = new Date();

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
  });

  document.getElementById(screenId).classList.add("active");

  displayTransactions();
  displayContacts();
  displayRecentTransactions();
  displayOutstanding();
  updateSummary();
}

function saveData() {
  localStorage.setItem("contacts", JSON.stringify(contacts));
  localStorage.setItem("transactions", JSON.stringify(transactions));
}

function addContact() {
  let name = document.getElementById("contactName").value.trim();
  let phone = document.getElementById("contactPhone").value.trim();
  let openingCredit = Number(document.getElementById("openingCredit").value) || 0;
  let openingDebit = Number(document.getElementById("openingDebit").value) || 0;
  let contactType = document.getElementById("contactType").value;

  if (name === "") {
    alert("Please enter contact name");
    return;
  }

  let exists = contacts.some(c => c.name.toLowerCase() === name.toLowerCase());

  if (exists) {
    alert("Contact already exists");
    return;
  }

  contacts.push({
    id: Date.now(),
    name: name,
    phone: phone,
    openingCredit: openingCredit,
    openingDebit: openingDebit,
    contactType: contactType
  });

  saveData();

  document.getElementById("contactName").value = "";
  document.getElementById("contactPhone").value = "";
  document.getElementById("openingCredit").value = "";
  document.getElementById("openingDebit").value = "";
  document.getElementById("contactType").value = "Customer";

  loadContacts();
  displayContacts();
  updateSummary();
}

function loadContacts() {
  let select = document.getElementById("personSelect");
  select.innerHTML = '<option value="">Select contact</option>';

  contacts.forEach(contact => {
    select.innerHTML += `<option value="${contact.name}">${contact.name}</option>`;
  });
}

function addTransaction() {
  let date = document.getElementById("date").value;
  let type = document.getElementById("type").value;
  let amount = Number(document.getElementById("amount").value);
  let dueDate = document.getElementById("dueDate").value;
  let selectedPerson = document.getElementById("personSelect").value;
  let newPerson = document.getElementById("newPerson").value.trim();
  let paymentMode = document.getElementById("paymentMode").value;
  let notes = document.getElementById("notes").value.trim();

  let person = selectedPerson || newPerson;

  if (date === "" || amount <= 0 || person === "") {
    alert("Please fill date, amount and person name");
    return;
  }

  if (newPerson && !contacts.some(c => c.name.toLowerCase() === newPerson.toLowerCase())) {
    contacts.push({
      id: Date.now(),
      name: newPerson,
      phone: "",
      openingCredit: 0,
      openingDebit: 0,
      contactType: "Other"
    });
  }

  if (editId === null) {
    transactions.push({
      id: Date.now(),
      date,
      type,
      amount,
      person,
      dueDate,
      paymentMode,
      notes
    });

    alert("Transaction saved successfully");
  } else {
    transactions = transactions.map(t => {
      if (t.id === editId) {
        return {
          id: editId,
          date,
          type,
          amount,
          person,
          dueDate,
          paymentMode,
          notes
        };
      }
      return t;
    });

    editId = null;
    alert("Transaction updated successfully");
  }

  saveData();

  document.getElementById("amount").value = "";
  document.getElementById("newPerson").value = "";
  document.getElementById("notes").value = "";
  document.getElementById("personSelect").value = "";

  loadContacts();
  displayTransactions();
  displayRecentTransactions();
  displayContacts();
  displayOutstanding();
  updateSummary();

  showScreen("home");
}

function displayTransactions() {
  let list = document.getElementById("transactionList");
  let search = document.getElementById("search").value.toLowerCase();

  list.innerHTML = "";

  let filtered = transactions.filter(t =>
    t.person.toLowerCase().includes(search)
  );

  filtered.slice().reverse().forEach(t => {
    list.innerHTML += `
      <div class="transaction">
        <strong>${t.person}</strong>
        <div class="${t.type.toLowerCase()}">
          ${t.type} ₹${t.amount}
        </div>
        <div class="small">
         ${t.date} | Due: ${t.dueDate || "Not Set"} | ${t.paymentMode}
        </div>
        <div class="small">${t.notes}</div>
        <button onclick="editTransaction(${t.id})">✏️ Edit</button>
        <button onclick="deleteTransaction(${t.id})">🗑 Delete</button>
      </div>
    `;
  });
}

function displayRecentTransactions() {
  let recent = document.getElementById("recentTransactions");
  recent.innerHTML = "";

  let latest = transactions.slice().reverse().slice(0, 5);

  if (latest.length === 0) {
    recent.innerHTML = `<p class="small">No transactions yet</p>`;
    return;
  }

  latest.forEach(t => {
    recent.innerHTML += `
      <div class="transaction">
        <strong>${t.person}</strong>
        <div class="${t.type.toLowerCase()}">
          ${t.type === "Credit" ? "+" : "-"} ₹${t.amount}
        </div>
        <div class="small">${t.date} | ${t.paymentMode}</div>
      </div>
    `;
  });
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveData();

  displayTransactions();
  displayRecentTransactions();
  displayContacts();
  updateSummary();
}

function updateSummary() {
  let totalCredit = 0;
  let totalDebit = 0;

  transactions.forEach(t => {
    if (t.type === "Credit") {
      totalCredit += t.amount;
    } else {
      totalDebit += t.amount;
    }
  });

  document.getElementById("totalCredit").innerText = "₹" + totalCredit;
  document.getElementById("totalDebit").innerText = "₹" + totalDebit;
  document.getElementById("netBalance").innerText = "₹" + (totalCredit - totalDebit);
}

function getPersonBalance(personName) {
  let contact = contacts.find(c => c.name === personName);

  let openingCredit = contact ? Number(contact.openingCredit) || 0 : 0;
  let openingDebit = contact ? Number(contact.openingDebit) || 0 : 0;

  let credit = 0;
  let debit = 0;

  transactions.forEach(t => {
    if (t.person === personName) {
      if (t.type === "Credit") credit += t.amount;
      else debit += t.amount;
    }
  });

  return openingCredit - openingDebit + credit - debit;
}

function displayContacts() {
  let list = document.getElementById("contactList");
  list.innerHTML = "";

  if (contacts.length === 0) {
    list.innerHTML = `<p class="small">No contacts added yet</p>`;
    return;
  }

  contacts.forEach(contact => {
    let balance = getPersonBalance(contact.name);

    list.innerHTML += `
<div class="contact-card" onclick="openPersonLedger('${contact.name}')">

    <strong>${contact.name}</strong>

    <div class="small">${contact.phone || "No phone number"}</div>

    <div class="small">${contact.contactType || "Other"}</div>

    <div class="small">Opening Credit: ₹${contact.openingCredit || 0}</div>

    <div class="small">Opening Debit: ₹${contact.openingDebit || 0}</div>

    <div class="${balance >= 0 ? "credit" : "debit"}">
        ${balance >= 0 ? "Receivable" : "Payable"} ₹${Math.abs(balance)}
    </div>

</div>
`;
  });
}

loadContacts();
displayTransactions();
displayRecentTransactions();
displayContacts();
updateSummary();
function openPersonLedger(personName) {
  showScreen("personLedger");

  document.getElementById("ledgerPersonName").innerText = personName;

  let credit = 0;
  let debit = 0;
  let personTransactions = [];

  transactions.forEach(t => {
    if (t.person === personName) {
      personTransactions.push(t);

      if (t.type === "Credit") {
        credit += t.amount;
      } else {
        debit += t.amount;
      }
    }
  });

  document.getElementById("personCredit").innerText = "₹" + credit;
  document.getElementById("personDebit").innerText = "₹" + debit;
  document.getElementById("personNet").innerText = "₹" + (credit - debit);

  let list = document.getElementById("personTransactions");
  list.innerHTML = "";

  personTransactions.slice().reverse().forEach(t => {
    list.innerHTML += `
      <div class="transaction">
        <div class="${t.type.toLowerCase()}">
          ${t.type} ₹${t.amount}
        </div>
        <div class="small">${t.date} | ${t.paymentMode}</div>
        <div class="small">${t.notes}</div>
      </div>
    `;
  });
}
function displayOutstanding() {
  let receivableList = document.getElementById("receivableList");
  let payableList = document.getElementById("payableList");

  receivableList.innerHTML = "";
  payableList.innerHTML = "";

  contacts.forEach(contact => {
    let balance = getPersonBalance(contact.name);

    if (balance > 0) {
      receivableList.innerHTML += `
        <div class="contact-card">
          <strong>${contact.name}</strong>
          <div class="credit">Receivable ₹${balance}</div>
        </div>
      `;
    } else if (balance < 0) {
      payableList.innerHTML += `
        <div class="contact-card">
          <strong>${contact.name}</strong>
          <div class="debit">Payable ₹${Math.abs(balance)}</div>
        </div>
      `;
    }
  });

  if (receivableList.innerHTML === "") {
    receivableList.innerHTML = `<p class="small">No receivables</p>`;
  }

  if (payableList.innerHTML === "") {
    payableList.innerHTML = `<p class="small">No payables</p>`;
  }
}
function editTransaction(id) {
  let transaction = transactions.find(t => t.id === id);

  if (!transaction) {
    alert("Transaction not found");
    return;
  }

  editId = id;

  document.getElementById("date").value = transaction.date;
  document.getElementById("type").value = transaction.type;
  document.getElementById("amount").value = transaction.amount;
  document.getElementById("paymentMode").value = transaction.paymentMode;
  document.getElementById("notes").value = transaction.notes;

  document.getElementById("personSelect").value = transaction.person;
  document.getElementById("newPerson").value = "";

  showScreen("add");
}
function downloadCSV() {
  let csv = "Date,Person,Type,Amount,Payment Mode,Notes\n";

  transactions.forEach(t => {
    csv += `${t.date},${t.person},${t.type},${t.amount},${t.paymentMode},${t.notes}\n`;
  });

  let blob = new Blob([csv], { type: "text/csv" });
  let url = URL.createObjectURL(blob);

  let a = document.createElement("a");
  a.href = url;
  a.download = "ledger.csv";
  a.click();

  URL.revokeObjectURL(url);
}
function backupData() {
  const data = {
    contacts: contacts,
    transactions: transactions
  };

  const jsonData = JSON.stringify(data, null, 2);

  const blob = new Blob([jsonData], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "ledger-backup.json";
  a.click();

  URL.revokeObjectURL(url);
}
function restoreData(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);

      contacts = data.contacts || [];
      transactions = data.transactions || [];

      saveData();

      loadContacts();
      displayContacts();
      displayTransactions();
      displayRecentTransactions();
      displayOutstanding();
      updateSummary();

      alert("Backup restored successfully");
    }
    catch(error) {
      alert("Invalid backup file");
    }
  };

  reader.readAsText(file);
}
function exportPersonPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  let personName = document.getElementById("ledgerPersonName").innerText;
  let contact = contacts.find(c => c.name === personName);

  if (!contact) {
    alert("Contact not found");
    return;
  }

  let openingCredit = Number(contact.openingCredit) || 0;
  let openingDebit = Number(contact.openingDebit) || 0;

  let personTransactions = transactions.filter(t => t.person === personName);

  let transactionCredit = 0;
  let transactionDebit = 0;

  personTransactions.forEach(t => {
    if (t.type === "Credit") transactionCredit += t.amount;
    else transactionDebit += t.amount;
  });

  let currentBalance =
    openingCredit - openingDebit + transactionCredit - transactionDebit;

  doc.setFontSize(18);
  doc.text("LEDGER STATEMENT", 70, 15);

  doc.setFontSize(12);
  doc.text(`Person: ${contact.name}`, 15, 30);
  doc.text(`Phone: ${contact.phone || "N/A"}`, 15, 38);
  doc.text(`Contact Type: ${contact.contactType || "Other"}`, 15, 46);

  doc.text(`Opening Credit: Rs. ${openingCredit}`, 15, 60);
  doc.text(`Opening Debit: Rs. ${openingDebit}`, 15, 68);

  doc.text("Transactions", 15, 82);

  let y = 92;

  doc.text("Date", 15, y);
  doc.text("Type", 55, y);
  doc.text("Amount", 95, y);
  doc.text("Mode", 135, y);

  y += 8;

  personTransactions.forEach(t => {
    if (y > 275) {
      doc.addPage();
      y = 20;
    }

    doc.text(t.date, 15, y);
    doc.text(t.type, 55, y);
    doc.text("Rs. " + t.amount, 95, y);
    doc.text(t.paymentMode, 135, y);

    y += 8;
  });

  y += 8;

  if (y > 260) {
    doc.addPage();
    y = 20;
  }

  doc.text(`Transaction Credit: Rs. ${transactionCredit}`, 15, y);
  y += 8;
  doc.text(`Transaction Debit: Rs. ${transactionDebit}`, 15, y);
  y += 8;
  doc.text(`Current Balance: Rs. ${currentBalance}`, 15, y);

  doc.save(`${personName}-ledger-statement.pdf`);
}