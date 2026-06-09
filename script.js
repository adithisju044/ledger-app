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
        <div class="small">${t.date} | ${t.paymentMode}</div>
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