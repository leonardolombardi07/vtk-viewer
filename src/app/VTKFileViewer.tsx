// @ts-nocheck

"use client";

import { useState, useRef, useEffect } from "react";

// VTK.js imports
import "@kitware/vtk.js/Rendering/Profiles/Geometry";
import vtkActor from "@kitware/vtk.js/Rendering/Core/Actor";
import vtkFullScreenRenderWindow from "@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow";
import vtkMapper from "@kitware/vtk.js/Rendering/Core/Mapper";
import vtkPolyDataReader from "@kitware/vtk.js/IO/Legacy/PolyDataReader";

export default function VTKFileViewer() {
  const vtkContainerRef = useRef(null);
  const context = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [representation, setRepresentation] = useState(2);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize VTK rendering context
  useEffect(() => {
    if (!context.current) {
      const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        rootContainer: vtkContainerRef.current,
      });

      const renderer = fullScreenRenderer.getRenderer();
      const renderWindow = fullScreenRenderer.getRenderWindow();

      // Set a nice background color
      renderer.setBackground(0.1, 0.1, 0.1);

      context.current = {
        fullScreenRenderer,
        renderWindow,
        renderer,
        reader: null,
        actor: null,
        mapper: null,
      };
    }

    return () => {
      if (context.current) {
        const { fullScreenRenderer, actor, mapper, reader } = context.current;
        if (actor) actor.delete();
        if (mapper) mapper.delete();
        if (reader) reader.delete();
        fullScreenRenderer.delete();
        context.current = null;
      }
    };
  }, []);

  // Handle representation changes
  useEffect(() => {
    if (context.current && context.current.actor) {
      const { actor, renderWindow } = context.current;
      actor.getProperty().setRepresentation(representation);
      renderWindow.render();
    }
  }, [representation]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".vtk")) {
        setSelectedFile(file);
        setError(null);
        loadVTKFile(file);
      } else {
        setError("Please select a valid .vtk file");
        setSelectedFile(null);
      }
    }
  };

  const loadVTKFile = async (file) => {
    if (!context.current) return;

    setIsLoading(true);
    setError(null);

    try {
      const { renderer, renderWindow } = context.current;

      // Clean up previous actor if exists
      if (context.current.actor) {
        renderer.removeActor(context.current.actor);
        context.current.actor.delete();
        context.current.mapper.delete();
        context.current.reader.delete();
      }

      // Create new reader
      const reader = vtkPolyDataReader.newInstance();

      // Read file as text (VTK files are text-based)
      const text = await file.text();

      // Parse the VTK data using parseAsText
      reader.parseAsText(text);

      const polydata = reader.getOutputData(0);

      if (!polydata || polydata.getNumberOfPoints() === 0) {
        throw new Error("Invalid or empty VTK file");
      }

      // Create mapper and actor
      const mapper = vtkMapper.newInstance();
      const actor = vtkActor.newInstance();

      mapper.setInputData(polydata);
      actor.setMapper(mapper);

      // Set initial representation
      actor.getProperty().setRepresentation(representation);

      // Add to renderer
      renderer.addActor(actor);

      // Store references
      context.current.reader = reader;
      context.current.mapper = mapper;
      context.current.actor = actor;

      // Reset camera and render
      renderer.resetCamera();
      renderWindow.render();
    } catch (err) {
      console.error("Error loading VTK file:", err);
      setError(`Error loading file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetCamera = () => {
    if (context.current && context.current.renderer) {
      context.current.renderer.resetCamera();
      context.current.renderWindow.render();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        backgroundColor: "#1a1a1a",
      }}
    >
      {/* VTK Container */}
      <div
        ref={vtkContainerRef}
        style={{
          width: "100%",
          height: "100%",
        }}
      />

      {/* Controls Panel */}
      <div
        style={{
          position: "absolute",
          top: "25px",
          left: "25px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(10px)",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          padding: "20px",
          minWidth: "280px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "16px",
            color: "#333",
            margin: "0 0 16px 0",
          }}
        >
          VTK File Viewer
        </h3>

        {/* File Upload */}
        <div style={{ marginBottom: "16px" }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".vtk"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />
          <button
            onClick={triggerFileInput}
            disabled={isLoading}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: isLoading ? "#ccc" : "#007bff",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => {
              if (!isLoading) e.target.style.backgroundColor = "#0056b3";
            }}
            onMouseOut={(e) => {
              if (!isLoading) e.target.style.backgroundColor = "#007bff";
            }}
          >
            {isLoading ? "Loading..." : "Upload VTK File"}
          </button>
        </div>

        {/* File Info */}
        {selectedFile && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px",
              fontSize: "13px",
            }}
          >
            <p style={{ margin: "0 0 4px 0", color: "#666" }}>
              <strong>File:</strong> {selectedFile.name}
            </p>
            <p style={{ margin: "0", color: "#666" }}>
              <strong>Size:</strong> {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div
            style={{
              marginBottom: "16px",
              padding: "12px",
              backgroundColor: "#f8d7da",
              border: "1px solid #f5c6cb",
              borderRadius: "6px",
              color: "#721c24",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* Representation Control */}
        {context.current?.actor && (
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "500",
                color: "#333",
                marginBottom: "8px",
              }}
            >
              Representation
            </label>
            <select
              value={representation}
              onChange={(e) => setRepresentation(Number(e.target.value))}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #ddd",
                borderRadius: "6px",
                fontSize: "14px",
                backgroundColor: "white",
              }}
            >
              <option value={0}>Points</option>
              <option value={1}>Wireframe</option>
              <option value={2}>Surface</option>
            </select>
          </div>
        )}

        {/* Reset Camera Button */}
        {context.current?.actor && (
          <button
            onClick={resetCamera}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = "#5a6268")}
            onMouseOut={(e) => (e.target.style.backgroundColor = "#6c757d")}
          >
            Reset Camera
          </button>
        )}

        {/* Instructions */}
        {!selectedFile && (
          <div
            style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#d1ecf1",
              borderRadius: "6px",
              fontSize: "13px",
              color: "#0c5460",
            }}
          >
            <p style={{ margin: "0 0 8px 0", fontWeight: "bold" }}>
              Instructions:
            </p>
            <p style={{ margin: "0", lineHeight: "1.4" }}>
              1. Click "Upload VTK File" to select a .vtk file
              <br />
              2. Use mouse to rotate, zoom, and pan the 3D view
              <br />
              3. Change representation to view as points, wireframe, or surface
            </p>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "3px solid #f3f3f3",
                borderTop: "3px solid #007bff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
              }}
            ></div>
            <span style={{ color: "#333" }}>Loading VTK file...</span>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}
