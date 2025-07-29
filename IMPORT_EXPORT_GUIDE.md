# 📁 Menu Project Import & Export Guide

This guide explains how to use the import and export functionality in the Menu Maker Projects page, which allows you to backup, share, and migrate menu projects using the MENU_PROJECT_SCHEMA.

## 🚀 Features Overview

### ✅ Import Functionality
- **Upload JSON files** that follow the MENU_PROJECT_SCHEMA
- **Automatic validation** against the schema structure
- **Conflict prevention** with auto-generated IDs and timestamps
- **Error handling** for invalid files or corrupted data
- **Support for all element types**: text, image, background, data, and shape elements

### ✅ Export Functionality
- **Individual project export** from project cards
- **Selected project export** from the action bar
- **Automatic filename generation** based on project name
- **Complete project data** including all pages, layers, elements, and settings
- **JSON format** for maximum compatibility

### ✅ Schema Management
- **Interactive schema viewer** with expandable details
- **Full schema documentation** viewable in new window
- **Type safety** with TypeScript validation

## 📥 How to Import Projects

### Step 1: Access Import
1. Navigate to the Menu Maker Projects page
2. Click the **"Import Project"** button in the action bar
3. Select a JSON file from your computer

### Step 2: File Requirements
Your JSON file must:
- ✅ Be a valid JSON file (`.json` extension)
- ✅ Follow the MENU_PROJECT_SCHEMA structure
- ✅ Include required fields: `id`, `name`, `createdAt`, `updatedAt`, `pages`, `settings`
- ✅ Have properly structured pages with layers and elements

### Step 3: Import Process
1. **File Selection**: Choose your JSON file
2. **Validation**: Automatic schema validation occurs
3. **Processing**: New ID and timestamps are generated
4. **Storage**: Project is saved to IndexedDB
5. **Refresh**: Projects list updates automatically

### Example Valid Import Structure
```json
{
  "id": "project-123",
  "name": "My Restaurant Menu",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "pages": [
    {
      "id": "page-1",
      "name": "Menu Page",
      "format": {
        "name": "A4",
        "width": 2480,
        "height": 3508,
        "printWidth": 210,
        "printHeight": 297
      },
      "backgroundColor": "#ffffff",
      "layers": [
        {
          "id": "layer-1",
          "name": "Content Layer",
          "visible": true,
          "locked": false,
          "opacity": 1,
          "elements": []
        }
      ]
    }
  ],
  "fonts": {
    "defaultFonts": [],
    "customFonts": [],
    "googleFonts": [],
    "loadedFonts": []
  },
  "settings": {
    "defaultFormat": "A4",
    "zoom": 1
  }
}
```

## 📤 How to Export Projects

### Method 1: Individual Project Export
1. Find the project you want to export
2. Click the **blue download icon** on the project card
3. The file will download automatically

### Method 2: Selected Project Export
1. Click on a project to select it
2. Click **"Export Selected"** in the action bar
3. The file will download automatically

### Method 3: Floating Action Export
1. Select a project by clicking on it
2. Use the **"Export"** button in the floating action panel
3. The file will download automatically

### Export File Details
- **Filename**: `project_name_menu_project.json`
- **Format**: JSON with 2-space indentation
- **Content**: Complete project data including all elements and settings
- **Compatibility**: Fully compatible with the import functionality

## 📋 Schema Information

### Required Top-Level Fields
- `id` (string): Unique project identifier
- `name` (string): Project display name
- `createdAt` (string): ISO timestamp of creation
- `updatedAt` (string): ISO timestamp of last update
- `pages` (array): Collection of menu pages
- `settings` (object): Project configuration

### Page Structure
Each page must include:
- `id`, `name`, `format`, `backgroundColor`, `layers`
- Format with width, height, and print dimensions
- Layers array with elements

### Element Types Supported
1. **Text Elements**: Typography, styling, positioning
2. **Image Elements**: Files, crops, filters
3. **Background Elements**: Colors, images, positioning
4. **Data Elements**: Menu items, categories, subcategories
5. **Shape Elements**: Rectangles, circles, triangles

### Font Management
- Default system fonts
- Custom uploaded fonts
- Google Fonts integration
- Loading state management

## 🔧 Advanced Features



### Schema Viewer
- Click **"Schema Details"** to expand information
- View structure requirements
- Click **"View Full Schema"** for complete JSON schema
- Opens in new window for easy reference

### Validation Features
- **Type checking**: Ensures correct data types
- **Structure validation**: Verifies required nested objects
- **Element validation**: Checks element properties
- **Error messages**: Clear feedback for invalid files

## 🚨 Troubleshooting

### Common Import Errors

**"Invalid JSON file"**
- Ensure file has `.json` extension
- Check JSON syntax with a validator
- Verify file isn't corrupted

**"Invalid menu project file"**
- Missing required fields (id, name, createdAt, etc.)
- Incorrect data types (string vs number)
- Invalid element structure
- Refer to the schema documentation for proper structure

**"Failed to import project"**
- Storage quota exceeded
- Network connectivity issues
- Try refreshing the page and importing again

### Export Issues

**"Project not found"**
- Project may have been deleted
- Try refreshing the projects list
- Check if project exists in IndexedDB

**"Failed to export project"**
- Browser storage issues
- Try clearing browser cache
- Ensure popup blockers aren't interfering

## 🎯 Best Practices

### For Importing
1. **Validate files** before importing using a JSON validator
2. **Backup existing projects** before importing new ones
3. **Check schema compatibility** when importing from external sources

### For Exporting
1. **Regular backups** - Export projects frequently
2. **Descriptive naming** - Use clear project names for easier identification
3. **Version control** - Export before major changes
4. **Share safely** - Remove sensitive information before sharing

### File Management
1. **Organize exports** in dedicated folders
2. **Use timestamps** in filenames for versions
3. **Document changes** when sharing with teams
4. **Test imports** after exporting to verify integrity

## 🔗 Technical Details

### Schema Validation
The import process uses comprehensive TypeScript validation:
- Runtime type checking for all properties
- Nested object structure verification
- Array content validation
- Required field enforcement

### Storage Integration
- **IndexedDB**: Local browser storage for projects
- **Automatic IDs**: Prevents conflicts during import
- **Timestamp updates**: Maintains proper chronological order
- **Error recovery**: Graceful handling of storage issues

### File Handling
- **Blob API**: Efficient file generation for exports
- **File API**: Secure file reading for imports
- **Memory management**: Automatic cleanup of temporary objects
- **Progress feedback**: User-friendly loading states

This import/export system provides a robust foundation for menu project management, ensuring data integrity while maintaining ease of use. 