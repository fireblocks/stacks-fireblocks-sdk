# Stacks Fireblocks SDK

A stateless SDK and REST API server for interacting with Fireblocks and the Stacks Network, enabling secure operations on Stacks using Fireblocks services.

---

## ⚡ Project Overview

**Stacks Fireblocks SDK** lets you securely execute Stacks transactions using Fireblocks vaults and raw signing.
It's designed to simplify integration with Fireblocks for secure Stacks transactions, supporting both direct SDK use and a REST API interface.

### **Prerequisites**

- Fireblocks workspace with raw signing enabled.
- Fireblocks API key and secret key file.
- Node.js v18+
- Docker and Docker Compose (for API server).

---

## 🚀 Features

- **Secure Stacks Transactions**: All transactions are Fireblocks-signed and submitted to Stacks.
- **Fireblocks raw signing support**
- **REST API mode**: Easily integrate through HTTP requests.
- **Vault pooling**: Efficient per-vault instance management.
