<p align="center">
  <img src="./template/logo.png" style="height:100px" />
</p>

# Amatl VS Code Extension  

**Convert your Markdown files into HTML and PDF with Amatl!**  

## 📜 Amatl

This extension is based on [Amatl](https://github.com/Bornholm/amatl), a binary tool that allows you to convert your Markdown files into HTML and PDF formats.

Transform your [CommonMark](https://commonmark.org/) (also known as [Markdown](https://en.wikipedia.org/wiki/Markdown)) files into full-fledged documents from the command line.

> **Why the name `amatl`?**  
> Amate (Spanish: amate `[aˈmate]`, from Nahuatl languages: āmatl `[ˈaːmat͡ɬ]`) is a type of bark paper that has been manufactured in Mexico since pre-Columbian times. It was primarily used to create codices.  
> **Source:** [Wikipedia](https://en.wikipedia.org/wiki/Amate)

### ✨ Features

- Create documents from local or remote resources via URL resolving.
- Integrate [MermaidJS](https://mermaid.js.org/) diagrams and code blocks with syntax highlighting.
- Use [custom directives](https://github.com/Bornholm/amatl/tree/master/doc/directives/README.md) to include other documents or generate tables of contents.
- Use [pre-defined or custom layouts](https://github.com/Bornholm/amatl/tree/master/doc/layouts/README.md) to transform your content into presentations, reports, etc.
- Use [Go templating](https://github.com/Bornholm/amatl/tree/master/doc/templating/README.md) to inject dynamic data into your document.

### 🚀 How to Use

> **⚠ Caution**  
> This project is in its early stages and subject to rapid evolution. Expect frequent changes and potential instability.

1. Download [the latest release](https://github.com/Bornholm/amatl/releases/latest) of `amatl`.
2. In your terminal, start transforming your documents into HTML:

```shell
amatl render html my-doc.md
```

See [`doc`](https://github.com/Bornholm/amatl/tree/master/doc/README.md) for more information.

## ⚡ Extension Features
✅ Automatic HTML and PDF generation upon saving.  
✅ Advanced management of excluded files.  
✅ Custom styling with a dedicated CSS file.  
✅ Easy to use with a simple installation.  

## 📦 Installation  
1. Download and install the extension from **VS Code Marketplace**.  
2. Configure your amatl.configDirectory if you wants witch your own template and style
3. Open a Markdown file and save it to generate HTML/PDF.  
4. Use Amatl Sidebar for insert directives
5. Add your own directives
6. tape ./ or ../ to autocomple a route file

## ⚙️ Configuration  

### 📝 amatl.generateHtmlOnSave
Enable HTML generation when saving a Markdown file.

### 📂 amatl.htmlDirectory
Target path to the generate html. If empty, in the same place of the md.

### 📄 amatl.generatePdfOnSave
Enable PDF generation when saving a Markdown file.

### 📂 amatl.pdfDirectory
Target path to the generate pdf. If empty, in the same place of the md.

### 📂 amatl.configDirectory
Path to an Amatl configuration directory. If empty, the default configuration is used.

**config.yml**  
Which allows you to customize the execution of Amatl:
```
html-layout: ./template.gohtml
pdf-scale: 0.7
pdf-margin-left: 1.0
pdf-margin-right: 1.0
```

**template.gohtml**
The template used for document generation.
```
<html>
	<head>
		<title>{{ .Meta.title }}</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<link rel="stylesheet" href="{{ resolve .Context "./theme.css" }}" />
  	</head>
  	
	<body>
    	{{ .Body }}
  </body>
</html>
```

**theme.css**
Your theme
```
body {
	font-family: "Roboto" !important;
	color: #333;	
    max-width: 1200px;
    margin: auto;
    padding:10px;
}
```

**noreplace.txt**
Exclude file md to transform to html/pdf
```
readme.md
mydir/other.md
```

**directives.json**
You can add directive to Amatl sidebar
```
[
    {
      "name": "Break Page",
      "code": "<div class='break-page'></div>",
      "replacePattern": "",
      "description": "Break Page"
    }
  ]
```


## 📜 License  
[MIT](./LICENSE)

