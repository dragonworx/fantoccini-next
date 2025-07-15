import { defineConfig } from "vite";
import { resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  // Build configuration for multiple entry points
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        // Main entry point - change 'main' to your desired output name
        main: resolve(__dirname, 'index.html'),
        
        // Demo page entry point
        demo: resolve(__dirname, 'demo.html'),
        
        // Example: Additional entry points (uncomment and modify as needed)
        // player: resolve(__dirname, 'player.html'),
        
        // Example: Entry points in subdirectories
        // admin: resolve(__dirname, 'admin/index.html'),
        // editor: resolve(__dirname, 'editor/index.html'),
      },
      output: {
        // Output directory structure
        dir: 'dist',
        
        // Custom output filenames (optional)
        // entryFileNames: '[name]/[name].[hash].js',
        // chunkFileNames: 'shared/[name].[hash].js',
        // assetFileNames: 'assets/[name].[hash].[ext]',
        
        // Example: Separate directories for each entry
        // entryFileNames: (chunkInfo) => {
        //   if (chunkInfo.name === 'main') return 'js/main.[hash].js';
        //   return '[name]/js/[name].[hash].js';
        // },
      }
    },
    
    // Example: Output to different directories entirely
    // outDir: 'dist',
    
    // Example: Keep source maps for debugging
    // sourcemap: true,
  },
  
  // Development server configuration
  server: {
    // Example: Custom port
    // port: 3000,
    
    // Example: Open browser automatically
    // open: true,
    
    // Example: Proxy API requests
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8080',
    //     changeOrigin: true,
    //   }
    // }
  },
  
  // Module resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@lib': resolve(__dirname, './src/lib'),
      
      // Add more aliases as needed
      // '@components': resolve(__dirname, './src/components'),
      // '@utils': resolve(__dirname, './src/utils'),
    }
  },
  
  // ESBuild configuration
  esbuild: {
    target: 'esnext'
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  
  // Example: Environment variables
  // define: {
  //   'process.env.NODE_ENV': '"production"',
  //   '__APP_VERSION__': JSON.stringify(process.env.npm_package_version),
  // },
  
  // Example: CSS configuration
  // css: {
  //   modules: {
  //     localsConvention: 'camelCase'
  //   },
  //   preprocessorOptions: {
  //     scss: {
  //       additionalData: `@import "@/styles/variables.scss";`
  //     }
  //   }
  // },
});