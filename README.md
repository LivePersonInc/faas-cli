<!-- omit in toc -->

# BREAKING CHANGES - CLI v2 Alpha

Liveperson Functions is currently in a transitory state towards v2. To make migration of you functions easier we have created a new version of the CLI. This version is _incompatible with functions v1_!
If you want to use both versions of the CLI simultaniously

```
# Install v2.0.1-alpha
> npm install -g liveperson-functions-cli@2.0.1-alpha

# Symlink the command to rename it to lpf2
> sudo mv "$(which lpf)" "$(dirname $(which lpf))/lpf2"

# Install v1.31.3
> npm install -g liveperson-functions-cli

# You can now use lpf as normal and lpf2

```

# LivePerson Functions CLI

[LivePerson Functions](https://faas.liveperson.net/) is a Function as a Service (FaaS) platform which enables brands to develop custom behaviors within LivePerson’s conversational platform, to better tailor the system to their specific needs. By offering these capabilities, Functions enables developers to write a simple function, deploy it to LivePerson's infrastructure and make it available to their LivePerson account in minutes. This allows you to create custom logic inside our conversational platform.

The LivePerson Functions Command Line Interface (CLI) is an open-source command-line tool provided by LivePerson that enables developers to create, edit and process their functions on their local development machines, in their favorite IDE of their choice. That way it’s very easy to keep the source code under version control in any Source Control Management (SCM).

The CLI offers nearly all functionality from the platform (e.g. deploy, undeploy and invoke).

Besides that it offers many commands to support developers during the development of a function (e.g. pull, push and debug).

For more information about LivePerson Functions see [developers.liveperson.com](https://developers.liveperson.com/liveperson-functions-overview.html)

- [Installation](#installation)
  - [Npm](#npm)
- [Commands](#commands)
  - [Init](#init)
  - [Login](#login)
    - [SSO-Support](#sso-support)
  - [Logout](#logout)
  - [Pull](#pull)
  - [Push](#push)
  - [Deploy](#deploy)
  - [Undeploy](#undeploy)
  - [Invoke](#invoke)
  - [Debug](#debug)
  - [Get](#get)
  - [Logs](#logs)
  - [Metrics](#metrics)
  - [Help](#help)
  - [Autocomplete](#autocomplete)
  - [Version and Update](#version-and-update)
- [Local development and debugging](#local-development-and-debugging)
  - [Introduction](#introduction)
  - [Preparation](#preparation)
  - [Snippets](##snippets)
  - [Debugging with VSC](#debugging-with-vsc)
  - [Debugging with IntelliJ](#debugging-with-intellij)
  - [Debugging with other IDEs or Debugger](#debugging-with-other-ides-or-debugger)
- [Troubleshooting](#troubleshooting)
  - [Using a proxy](#using-a-proxy)

## Installation

Before you start using lpf, you have to make it available on your computer. Even if it's already installed, it's probably a good idea to update to the latest version. You can install it as a npm package.

### Npm

```
> npm install -g liveperson-functions-cli
```

> Please make sure you have all user rights on your computer or run the commands with sudo or the cmd as admin, otherwise some operations will fail due to missing rights

## Commands

<table style="width: 100%;">
<thead>
  <tr>
    <th style="width: 100px;" >Command</th>
    <th style="width: 276px;">Description</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>Init</td>
    <td>Initialize the project with the necessary files. If the project is already initialized it will add a new function.</td>
  </tr>
  <tr>
    <td>Login</td>
    <td>Performs the login with LiveEngage Credentials.</td>
  </tr>
  <tr>
    <td>Logout</td>
    <td>Performs the logout.</td>
  </tr>
  <tr>
    <td>Pull</td>
    <td>Pulls a function from the LivePerson functions platform.</td>
  </tr>
  <tr>
    <td>Push</td>
    <td>Pushes a function to the LivePerson functions platform.</td>
  </tr>
  <tr>
    <td>Deploy</td>
    <td>Deploys a function on the LivePerson functions platform. If the passed function is already deployed, it will be redeployed.</td>
  </tr>
  <tr>
    <td>Undeploy</td>
    <td>Undeploys a function on the LivePerson functions platform.</td>
  </tr>
  <tr>
    <td>Invoke</td>
    <td>Invokes a function (remote or local).</td>
  </tr>
  <tr>
    <td>Debug</td>
    <td>Starts a debug port in the range of 30500 - 31000 for a passed function.</td>
  </tr>
  <tr>
    <td>Get</td>
    <td>Get information about the passed domain. Possible domains are deployments, functions and account.</td>
  </tr>
  <tr>
    <td>Help</td>
    <td>Shows help for the cli and the supported commands.</td>
  </tr>
  <tr>
    <td>Autocomplete</td>
    <td>Displays autocomplete instructions (only supports zsh and bash).</td>
  </tr>
  <tr>
    <td>Version</td>
    <td>Shows the current installed version.</td>
  </tr>
</tbody>
</table>

### Init

Initialize the project with the necessary files. If the project is already initialized it will add a new function with the passed function name.

The folder name has to be same as the function name (saved in the `config.json`).

In the `config.json` of a function you can change the description, event, related input and environment variables of the function.

For the `event` field please use `lpf get events` to get the related event and paste the eventId as `event`.

Following files will be created:

- README: Contains information about the usage of the CLI
- .gitignore: Specifies intentionally untracked files to ignore ([Link](https://git-scm.com/docs/gitignore))
- .vscode: VS code settings and tasks for the local debugger (do not change these files!)
- bin: Local toolbelt, rewire requirements and debugger (do not change these files!)
- functions: Contains the different functions folder
- settings: Contains the secrets and whitelisting.
- functions folder:
  - index.js: Contains the function
  - config.json: Contains the function name and event and the related input and environment variables.

<details>
<summary>Folder structure</summary>

```
README.md
.gitignore
.vscode/
  ├── launch.json
  └── task.json
bin/
  ├── core-functions-toolbelt/
      ├── //Toolbelt functions
      └── package.json
  ├── rewire.js
  └── faas-debugger.js
functions/
    settings.json
    exampleFunction/
        ├── index.js
        └── config.json
    customFunction/
        ├── index.js
        └── config.json
```

</details>

<details>
<summary>Usage </summary>

```
> lpf init [parameter]
```

</details>

<details>
<summary>Options </summary>

| Parameter     | Description                                              |
| ------------- | -------------------------------------------------------- |
| function name | Adds a function with the passed name (multiple possible) |

| Flag      | Description                    |
| --------- | ------------------------------ |
| -h --help | Show help for the init command |

</details>

<details>
<summary>Example</summary>

```
> lpf init <function name>

> lpf init <function name> <function name>
```

</details>

### Login

Performs the login with LiveEngage Credentials.

After a successful login, it is valid for 8 hours. After this period of time a new login has to be performed. It is also possible to have multiple logins saved, but only one at a time is active.

The command will create a temp file with the credentials in the `node temp dir` (see [doc](https://nodejs.org/api/os.html#os_os_tmpdir)). The file is encrypted with aes256.

To switch between accounts just run the login command again and select your desired account. If the login is not valid anymore for this account you have to pass again the credentials.

If you want to add a new account just run the login command and select `other`.

<details>
<summary>Usage</summary>

```
> lpf login [--flag]
```

</details>

<details>
<summary>Options</summary>

| Flag           | Description                     |
| -------------- | ------------------------------- |
| -h --help      | Show help for the login command |
| -a --accountId | AccountId                       |
| -u --username  | Username                        |
| -p --password  | Password                        |

</details>

<details>
<summary>Example</summary>

```
> lpf login

> lpf login --accountId 123456789 --username user@liveperson.com --password p4ssw0rd

> lpf login -a 123456789 -u user@liveperson.com -p p4ssw0rd
```

</details>

#### SSO-Support

Currently the CLI login is restricted to the [user login](https://developers.liveperson.com/login-service-api-methods-user-login.html). To use the login with an SSO enabled account you have to fetch the token and userId from the FaaS UI.

> It is advisable to create a separate account for the CLI, because with each new login on a different page the token expires in the CLI (only one login per account is possible).

To get the token and the userId do following steps:

1. Open the FaaS UI and login.
2. Open the developer tools of your browser.
3. Go to the tab 'Application'.
4. Open the session storage with the key 'houston.<accountId>'.
5. Copy token and userId.

   - Token: 'glob'
   - UserId: 'config.userId'
     <img src="faas-cli-fetch-token.png" class="fancyimage" width="100%" alt="LivePerson Functions CLI token">

6. Run the login command as follows: `lpf login --token <bearer> --accountId <accountId> --userId <userId>`

> Note: If you get a message that the token is not valid anymore, you have to perform step 1 - 6 again.

### Logout

Performs the logout

After a successful logout the token for the selected account will be set to `null`. You can pass an accountId as flag, so no selection will be triggered.

Futhermore it's possible to provide a delete flag, then the account will be deleted from the temp file.

<details>
<summary>Usage</summary>

```
> lpf logout [--flag]
```

</details>

<details>
<summary>Options</summary>

| Flag           | Description                                            |
| -------------- | ------------------------------------------------------ |
| -h --help      | Show help for the login command                        |
| -a --accountId | Account which will be logged out                       |
| -d --delete    | Deletes the account credentials from the local machine |

</details>

<details>
<summary>Example</summary>

```
> lpf logout

> lpf logout --accountId 123456789

> lpf logout --accountId 123456789 --delete

> lpf logout -a 123456789 -d
```

</details>

### Pull

Pulls a function from the LivePerson functions platform (function has to exist on the platform).

You will be asked, if you want to overwrite your local state with the one from the platform.

The confirmation can be skipped by passing the --yes flag.

You can pass the --all flag, if you want to pull all functions from the platform.

<details>
<summary>Usage</summary>

```
> lpf pull [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter     | Description                                    |
| ------------- | ---------------------------------------------- |
| function name | Pass the function for pull (multiple possible) |

| Flag          | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| -h --help     | Show help for the pull command                                          |
| -y --yes      | Agrees to the approval of the pull and prevents the confirmation dialog |
| -w --no-watch | Hide information about the pull process                                 |
| -a --all      | Pulls all functions from the platform                                   |

</details>

<details>
<summary>Example</summary>

```
> lpf pull exampleFunction

> lpf pull exampleFunction --yes --no-watch

> lpf pull exampleFunction1 exampleFunction2 -y -w
```

</details>

### Push

Pushes a function to the LivePerson functions platform.

You will be asked, if you want to overwrite your remote state with the one from your local machine.

The confirmation can be skipped by passing the --yes flag.

If it's a new function, which is not created on the platform, the CLI will create this one.

You can pass the --all flag, if you want to push all local functions to the platform.

<details>
<summary>Usage</summary>

```
> lpf push [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter     | Description                                    |
| ------------- | ---------------------------------------------- |
| function name | Pass the function for push (multiple possible) |

| Flag          | Description                                                             |
| ------------- | ----------------------------------------------------------------------- |
| -h --help     | Show help for the push command                                          |
| -y --yes      | Agrees to the approval of the push and prevents the confirmation dialog |
| -w --no-watch | Hide information about the push process                                 |
| -a --all      | Pushes all local functions                                              |

</details>

<details>
<summary>Example</summary>

```
> lpf push exampleFunction

> lpf push exampleFunction --yes --no-watch

> lpf push exampleFunction1 exampleFunction2 -y -w
```

</details>

### Deploy

Deploys a function on the LivePerson functions platform.

To deploy a function it has to exist on the LivePerson functions platform. You can use the `push command` in order to ensure this.

If the passed function is already deployed, it will be redeployed.

The command can be run from the root directory or functions folder, then it's necessary to pass a function name. If the user runs the command inside a functions folder, it's not necessary and the command will take the function of the current directory.

<details>
<summary>Usage</summary>

```
> lpf deploy [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter     | Description                                          |
| ------------- | ---------------------------------------------------- |
| function name | Pass the function for deployment (multiple possible) |

| Flag          | Description                                                                   |
| ------------- | ----------------------------------------------------------------------------- |
| -h --help     | Show help for the deploy command                                              |
| -y --yes      | Agrees to the approval of the deployment and prevents the confirmation dialog |
| -w --no-watch | Hide information about the deployment process                                 |

</details>

<details>
<summary>Example</summary>

```
> lpf deploy exampleFunction

> lpf deploy exampleFunction --yes --no-watch

> lpf deploy exampleFunction1 exampleFunction2 -y -w
```

</details>

### Undeploy

Undeploys a function on the LivePerson functions platform.

To undeploy a function it has to exist on the LivePerson functions platform. You can use the `push command` in order to ensure this.

The command can be run from the root directory or functions folder, then it's necessary to pass a function name. If the user runs the command inside a functions folder, it's not necessary and the command will take the function of the current directory.

<details>
<summary>Usage</summary>

```
> lpf undeploy [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter     | Description                                            |
| ------------- | ------------------------------------------------------ |
| function name | Pass the function for undeployment (multiple possible) |

| Flag          | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| -h --help     | Show help for the deploy command                                                |
| -y --yes      | Agrees to the approval of the undeployment and prevents the confirmation dialog |
| -w --no-watch | Hide information about the undeployment process                                 |

</details>

<details>
<summary>Example</summary>

```
> lpf undeploy exampleFunction

> lpf undeploy exampleFunction --yes --no-watch

> lpf undeploy exampleFunction1 exampleFunction2 -y -w
```

</details>

### Invoke

Invokes a function (remote or local).

If you pass the --local flag the function will be invoked locally. Otherwise it will be invoked on the functions platform.

For both cases it will use the input from the related function config.json.

> The local invocation uses the mocked `faas-toolbelt` so please have a look at [Preparation](#preparation) for further information.

<details>
<summary>Usage</summary>

```
> lpf invoke [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter     | Description                 |
| ------------- | --------------------------- |
| function name | Pass the function to invoke |

| Flag       | Description                               |
| ---------- | ----------------------------------------- |
| -h --help  | Show help for the invoke command          |
| -l --local | Invokes the function on the local machine |

</details>

<details>
<summary>Example</summary>

```
> lpf invoke exampleFunction

> lpf invoke exampleFunction --local

> lpf invoke exampleFunction1 -l
```

</details>

### Debug

Starts a debug port in the range of 30500 - 31000 for a passed function.

<details>
<summary>Usage</summary>

```
> lpf debug [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter     | Description                |
| ------------- | -------------------------- |
| function name | Pass the function to debug |

| Flag      | Description                     |
| --------- | ------------------------------- |
| -h --help | Show help for the debug command |

</details>

<details>
<summary>Example</summary>

```
> lpf debug exampleFunction
```

</details>

### Get

Get information about the passed domain. Possible domains are deployments, functions, account and events.

The following information will be displayed:

- Deployment: Name, Undeployed changes from, Last successful deployment, deployed by, deployment state
- Function: Name, Status, last changed at, last changed by, Event
- Account: Offers insights that are currently generated by the welcome page
- Events: Event name and eventId

<details>
<summary>Usage</summary>

```
> lpf get [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter | Description                             |
| --------- | --------------------------------------- |
| domain    | Pass a valid domain (multiple possible) |

| Flag      | Description                   |
| --------- | ----------------------------- |
| -h --help | Show help for the get command |

</details>

<details>
<summary>Example</summary>

```
> lpf get account

> lpf get functions deployments

> lpf get functions deployments account

> lpf get functions deployments account events
```

</details>

### Logs

Get logs from function.

<details>
<summary>Usage</summary>

```
> lpf logs [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter | Description                      |
| --------- | -------------------------------- |
| function  | function name to fetch logs from |

| Flag               | Description                    |
| ------------------ | ------------------------------ | ----- | ----------------------------------------------------------------------------------------- |
| -h --help          | Show help for the get command  |
| -s, --start=start  | (required) start timestamp     |
| -e, --end=end      | end timestamp                  |
| -l, --levels=Info  | Warn                           | Error | log-levels - for multiple levels just use levels with space separated (e.g. -l Info Warn) |
| -r, --removeHeader | Removes the header of the logs |

</details>

<details>
<summary>Example</summary>

```
> lpf logs exampleFunction --start=1626156400000

> lpf logs exampleFunction --start=1626156400000 --end=1626157400000

> lpf logs exampleFunction --start=1626156400000 --levels=Info Warn

Fetching logs via cronjob every 10 minutes (delayed by 1 minute to be sure no logs are missed) and write it to a file::
MacOS:
1/10 * * * * lpf logs exampleFunction --start=$(date -v0S -v-11M +%s000) --end=$(date -v0S -v-1M +%s000) >> exampleFunction.log
```

</details>

### Metrics

Get invocation metrics of a function. Optionally export them as json or CSV for additional processing. The cli will automatically aggregate invocations into buckets appropriate to the queried time span.

<details>
<summary>Usage</summary>

```
> lpf metrics [parameter] [--flag]
```

</details>

<details>
<summary>Options</summary>

| Parameter | Description                      |
| --------- | -------------------------------- |
| function  | function name to fetch logs from |

| Flag              | Description                                |
| ----------------- | ------------------------------------------ | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| -h --help         | Show help for the get command              |
| -s, --start=start | Start timestamp                            |
| -e, --end=end     | End timestamp (Default: Current Timestamp) |
| -l, --last=Xh     | Xd                                         | Xm                                                                     | Alternative to start flag, metrics for the period of the last x hours eg. last 12h, 7d |
| -o, --output=json | csv                                        | Outputs the metrics data as json or csv rather than displaying a table |

</details>

<details>
<summary>Example</summary>

```
> lpf metrics exampleFunction --last=7d

> lpf metrics exampleFunction --start=1626156400000

> lpf metrics exampleFunction --end=1626156400000 --last=7d

> lpf metrics exampleFunction --start=1626156400000 --end=1626157400000',

> lpf metrics exampleFunction --last=7d --output=csv',


Fetching metrics via cronjob every 24 hours and write it to a file:
MacOS:
0 0 * * * lpf metrics exampleFunction -l=1d -o=csv >> exampleFunction.csv
```

</details>

### Help

If you ever need help while using lpf, there are three equivalent ways to get the comprehensive manual page (manpage) help for any of the lpf commands:

```
> lpf help

> lpf help <command>

> lpf <command> --help -h
```

For example, you can get the manpage help for the lpf login command by running

```
> lpf help login
```

### Autocomplete

Displays autocomplete instructions (only supports zsh and bash)

<details>
<summary>Usage</summary>

```
> lpf autocomplete [--flag]
```

</details>

<details>
<summary>Options</summary>

| Flag         | Description                                     |
| ------------ | ----------------------------------------------- |
| -h --help    | Show help for the login command                 |
| -r --refresh | Refresh cache (ignores displaying instructions) |

</details>

<details>
<summary>Example</summary>

```
> lpf autocomplete

> lpf autocomplete bash

> lpf autocomplete zsh

> lpf autocomplete --refresh-cache
```

</details>

### Version and Update

The version command shows the current installed version of the CLI.
If a newer version is available the user will see an update information which shows his current version, the new version and a information about how to update to the new version.

The update notification will appear one time and then it's muted for two days.

<details>
<summary>Example</summary>

```
> lpf version

> lpf -v

> lpf --version
```

</details>

## Local development and debugging

### Introduction

The CLI provides a way to debug and develop functions locally.

For the best developer experience it's recommended to use [Visual Studio Code](https://code.visualstudio.com/) (VSC) or [IntelliJ](https://www.jetbrains.com/idea/), because a configuration for the integrated debugger is provided by the CLI.

During the debugging process all console outputs will be printed to your terminal. At the end a history with all printed console outputs will be displayed.

### Snippets/Live-Templates

We include a number of snippets (vscode) and Live-Templates (IntelliJ IDEA) for you to ease development. Your vscode should automatically detect `faas-snippets.code-snippets` in the `.vscode` folder. Meanwhile you will have to [manually import](https://www.jetbrains.com/help/idea/sharing-live-templates.html#import) the `settings_live_templates.zip` from the `.idea` folder to use the same functionality inside IntelliJ IDEA.

Once setup you can use the following snippets/Live-Templates:

- HTTP Snippet
- Read/Update Secret Snippets
- Create/Read/Update/Delete Context Session Store Snippet
- Conversation Util Snippet
- GDPR Util Snippet
- SDE Util Snippet
- Salesforce Snippet

### Preparation for Debugging

It's necessary to run the `lpf init` command to initialize the project structure and to install all required packages for the local faas-toolbelt.

To get started with the local development and debugging some preparation is needed:

- Local secrets and whitelisting can be stored in the settings.json
- Local environment variables and input can be stored in the config.json in the functions folder
- The Debugger will use a mocked `faas-toolbelt`
- To have access to the LivePerson services it's necessary to be logged in or set an environment variable called `BRAND_ID` with your `accountId`
  - Example with BRAND_ID and debug command: `BRAND_ID=123456789 lpf debug TestFunction`

### Debugging with VSC

1. Set a breakpoint in your desired function.
2. Run the debugger (two options available)
   1. `lpf debug <function name>`
   2. Open command palette -> `Tasks: Run Task` -> `Debug Function`
3. Run `Attach FaaS Debugger` from the `launch.json`.
4. The debugger will start and pause at the auto-generated code.
5. Use IntelliJ debugger to navigate through your code.

### Debugging with IntelliJ

1. Set a breakpoint in your desired function.
2. Run the debugger (two options available)
   1. Use the built-in bar at the right top corner or
   2. Click on `Run` -> `Run...`
3. Select `Start FaaS Debugger` and run the command.
4. Select `Attach FaaS Debugger` and run the command.
5. The debugger will start and pause at the auto-generated code.
6. Use IntelliJ debugger to navigate through your code.

### Debugging with other IDEs or Debugger

1. Set a breakpoint in your desired function.
2. Run the debugger (two options available)
   1. Run `lpf debug <function name>` or
   2. Run `node ../bin/debug.js <function name>`
3. A debug port will start on the port 1337
4. Attach your favorite IDE or debugger to this port
5. Use the debugger to navigate through your code.

## Troubleshooting

### Using a proxy

If the envar `HTTPS_PROXY` or `https_proxy` is set the `lpf` command will use the respective URLs to forward all calls.
