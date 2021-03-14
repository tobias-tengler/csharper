# Installation

<!-- todo: this does not work correctly -->

Click [here](vscode://tobiastengler.csharper) to install this extension directly or visit the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=tobiastengler.csharper).

# Functionality

This extension adds two new ways to create C# files.

## Create C# files from the Explorer Context Menu

Right clicking a directory now presents a new option: `New C# File`

After selecting a template and a filename the templated file will be created in the selected directory:

<!-- todo: cut gif and better quality -->
<img src="assets/context-menu.gif" alt="Create C# files from the Explorer Context Menu" />

## Create C# files using a shortcut

If you prefer to only use your keyboard, there is also a new shortcut: `Ctrl+J Ctrl+J`

As any other keybinding in VS Code `Ctrl+J Ctrl+J` can be remapped to whatever you prefer. The name of the shortcut is `csharper.newFile`.

Creating a new templated C# file using the shortcut follows the following user flow:

`Select workspace folder` > `Select project` > `Select directory` > `Select template` > `Select filename`

If there is only one choice or a step is not necessary, it will be skipped in order to save some time.

### Multiple workspace folders

If you have opened a workspace with multiple folders, the shortcut will first prompt you to select one of those workspace folders:

<img src="assets/multiple-workspaces.png" alt="Multiple workspace folders" width=500 />

### Multiple project files

If you are in a workspace folder with multiple project files, the shortcut will prompt you to select one of those projects:

<img src="assets/multiple-projects.png" alt="Multiple project files" width=500 />

If you press the shortcut while focusing a document, the nearest project file to that document will be selected per default.

### Selecting the destination directory

After the project directory has been determined you need to select the destination directory of your file:

<img src="assets/select-directory.png" alt="Selecting the destination directory" width=500 />

All directories will be displayed in a flat hierarchy. If there are directories with the same name, the relative path to those directories will also be displayed.

# Current Limitations

- The `<RootNamespace>` tag in `.csproj` files is currently not taken into account
- Namespaces of files in the same directory are currenty not taken into account
