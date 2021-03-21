import * as assert from "assert";
import * as vscode from "vscode";
import { getNamespaceFromString, getNearestProjectFile, getProjectName, getRootNamespaceFromString } from "./projects";

suite("getNamespaceFromString", () => {
  test("Namespace", () => {
    const content = `using System;
    namespace Test
    {
      public class Example
      {
      }
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });

  test("Namespace with dots", () => {
    const content = `using System;
    namespace Test1.Test2.Test3
    {
      public class Example
      {
      }
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, "Test1.Test2.Test3");
  });

  test("No namespace", () => {
    const content = `using System;
    public class Example
    {
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("Namespace commented out", () => {
    const content = `using System;
    // namespace Test
    // {
    public class Example
    {
    }
    // }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("Namespace commented out with block", () => {
    const content = `using System;
    /*namespace Test*/
    
    public class Example
    {
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("Namespace commented out in block", () => {
    const content = `/*using System;
    namespace Test
    {*/
    public class Example
    {
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("Namespace with unrelated comment block above", () => {
    const content = `
    /*
    using System;
    */
    namespace Test
    {
      public class Example
      {
      }
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });

  test("Namespace with unrelated comment block below", () => {
    const content = `
    
    namespace Test
    {
      /*public class Example
      {
      }*/
    }`;
    const namespace = getNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });
});

suite("getRootNamespaceFromString", () => {
  test("RootNamespace", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
      <RootNamespace>Test</RootNamespace>
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });

  test("RootNamespace with dots", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
      <RootNamespace>Test1.Test2.Test3</RootNamespace>
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, "Test1.Test2.Test3");
  });

  test("No RootNamespace", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("RootNamespace commented out", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
      <!-- <RootNamespace>Test</RootNamespace> -->
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("RootNamespace commented out in block", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <!-- <TargetFramework>net5.0</TargetFramework>
      <RootNamespace>Test</RootNamespace>
      <OutputType>Exe</OutputType> -->
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("RootNamespace with unrelated comment block above", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <!-- <TargetFramework>net5.0</TargetFramework>
      <OutputType>Exe</OutputType> -->
      <RootNamespace>Test</RootNamespace>
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });

  test("RootNamespace with unrelated comment block below", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <RootNamespace>Test</RootNamespace>
      <!-- <TargetFramework>net5.0</TargetFramework>
      <OutputType>Exe</OutputType> -->
    </PropertyGroup>
  </Project>`;
    const namespace = getRootNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });
});

suite("getNearestProjectFile", () => {
  test("No project files", () => {
    const projectFiles: vscode.Uri[] = [];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });

  test("Origin in same folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile?.fsPath, projectFile.fsPath);
  });

  test("Origin on same folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile?.fsPath, projectFile.fsPath);
  });

  test("Origin below project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/subdir/example.cs");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile?.fsPath, projectFile.fsPath);
  });

  test("Origin two below project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/subdir/subdir2/example.cs");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile?.fsPath, projectFile.fsPath);
  });

  test("Origin above project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/subdir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });

  test("Origin in different folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/subdir/example.cs");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });

  test("Origin on different folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/subdir");

    const nearestProjectFile = getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });
});

suite("getProjectName",() => {
  test("Project name", () => {
    const projectFile = vscode.Uri.file("/home/user/src/Project.csproj")
    const projectName = getProjectName(projectFile)

    assert.strictEqual(projectName, "Project");
  })

  test("Project name with dots", () => {
    const projectFile = vscode.Uri.file("/home/user/src/Project1.Project2.csproj")
    const projectName = getProjectName(projectFile)

    assert.strictEqual(projectName, "Project1.Project2");
  })

  test("Project name with unsupported symbols", () => {
    const projectFile = vscode.Uri.file("/home/user/src/Pro!je-ct.csproj")
    const projectName = getProjectName(projectFile)

    assert.strictEqual(projectName, "Project");
  })
})