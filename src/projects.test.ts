import * as assert from "assert";
import * as vscode from "vscode";
import { projects } from "./projects";

suite("getNamespaceFromString", () => {
  test("Base case", () => {
    const content = `using System;
    namespace Test
    {
      public class Example
      {
      }
    }`;
    const namespace = projects.getNamespaceFromString(content);

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
    const namespace = projects.getNamespaceFromString(content);

    assert.strictEqual(namespace, "Test1.Test2.Test3");
  });

  test("No namespace", () => {
    const content = `using System;
    public class Example
    {
    }`;
    const namespace = projects.getNamespaceFromString(content);

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
    const namespace = projects.getNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("Namespace commented out with block", () => {
    const content = `using System;
    /*namespace Test*/
    
    public class Example
    {
    }`;
    const namespace = projects.getNamespaceFromString(content);

    assert.strictEqual(namespace, null);
  });

  test("Namespace commented out in block", () => {
    const content = `/*using System;
    namespace Test
    {*/
    public class Example
    {
    }`;
    const namespace = projects.getNamespaceFromString(content);

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
    const namespace = projects.getNamespaceFromString(content);

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
    const namespace = projects.getNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });
});

suite("getRootNamespaceFromString", () => {
  test("Base case", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
      <RootNamespace>Test</RootNamespace>
    </PropertyGroup>
  </Project>`;
    const namespace = projects.getRootNamespaceFromString(content);

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
    const namespace = projects.getRootNamespaceFromString(content);

    assert.strictEqual(namespace, "Test1.Test2.Test3");
  });

  test("No RootNamespace", () => {
    const content = `<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
    </PropertyGroup>
  </Project>`;
    const namespace = projects.getRootNamespaceFromString(content);

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
    const namespace = projects.getRootNamespaceFromString(content);

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
    const namespace = projects.getRootNamespaceFromString(content);

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
    const namespace = projects.getRootNamespaceFromString(content);

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
    const namespace = projects.getRootNamespaceFromString(content);

    assert.strictEqual(namespace, "Test");
  });
});

suite("getNearestProjectFile", () => {
  test("No project files", () => {
    const projectFiles: vscode.Uri[] = [];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });

  test("Origin in same folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, projectFile);
  });

  test("Origin on same folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, projectFile);
  });

  test("Origin below project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/subdir/example.cs");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, projectFile);
  });

  test("Origin two below project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/subdir/subdir2/example.cs");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, projectFile);
  });

  test("Origin above project file", () => {
    const projectFile = vscode.Uri.file("/src/dir/subdir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/dir/example.cs");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });

  test("Origin in different folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/subdir/example.cs");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });

  test("Origin on different folder", () => {
    const projectFile = vscode.Uri.file("/src/dir/example.csproj");
    const projectFiles: vscode.Uri[] = [projectFile];
    const origin = vscode.Uri.file("/src/subdir");

    const nearestProjectFile = projects.getNearestProjectFile(projectFiles, origin);

    assert.strictEqual(nearestProjectFile, null);
  });
});

suite("getProjectName", () => {
  test("Base case", () => {
    const projectFile = vscode.Uri.file("/home/user/src/Project.csproj");
    const projectName = projects.getProjectName(projectFile);

    assert.strictEqual(projectName, "Project");
  });

  test("Project name with dots", () => {
    const projectFile = vscode.Uri.file("/home/user/src/Project1.Project2.csproj");
    const projectName = projects.getProjectName(projectFile);

    assert.strictEqual(projectName, "Project1.Project2");
  });

  test("Project name with unsupported symbols", () => {
    const projectFile = vscode.Uri.file("/home/user/src/Pro!je-ct.csproj");
    const projectName = projects.getProjectName(projectFile);

    assert.strictEqual(projectName, "Project");
  });
});

suite("appendPathSegementsToProjectName", () => {
  test("Base case", () => {
    const projectName = "Project";
    const projectFile = vscode.Uri.file("/home/user/src/project.csproj");
    const filepath = vscode.Uri.file("/home/user/src/Models/Database/File.cs");

    const namespace = projects.appendPathSegementsToProjectName(projectName, projectFile, filepath);

    assert.strictEqual(namespace, "Project.Models.Database");
  });

  test("Same directory", () => {
    const projectName = "Project";
    const projectFile = vscode.Uri.file("/home/user/src/project.csproj");
    const filepath = vscode.Uri.file("/home/user/src/File.cs");

    const namespace = projects.appendPathSegementsToProjectName(projectName, projectFile, filepath);

    assert.strictEqual(namespace, "Project");
  });

  test("Directories contain dot", () => {
    const projectName = "Project";
    const projectFile = vscode.Uri.file("/home/user/src/project.csproj");
    const filepath = vscode.Uri.file("/home/user/src/Database.Models/Table/File.cs");

    const namespace = projects.appendPathSegementsToProjectName(projectName, projectFile, filepath);

    assert.strictEqual(namespace, "Project.Database.Models.Table");
  });

  test("File outside of project directory", () => {
    const projectName = "Project";
    const projectFile = vscode.Uri.file("/home/user/src/project.csproj");
    const filepath = vscode.Uri.file("/home/something/Models/Database/File.cs");

    const namespace = projects.appendPathSegementsToProjectName(projectName, projectFile, filepath);

    assert.strictEqual(namespace, "Project");
  });

  test("File outside of project directory (start of directory matches)", () => {
    const projectName = "Project";
    const projectFile = vscode.Uri.file("/home/user/src/project.csproj");
    const filepath = vscode.Uri.file("/home/user/src2/Models/Database/File.cs");

    const namespace = projects.appendPathSegementsToProjectName(projectName, projectFile, filepath);

    assert.strictEqual(namespace, "Project");
  });
});
