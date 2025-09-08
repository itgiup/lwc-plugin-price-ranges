import { defineConfig } from 'vite';

const input = {
	main: 'src/example/index.html',
};

export default defineConfig({
	build: {
		rollupOptions: {
			input,
		},
		outDir: 'build',
	},
  server: {
    host: true, // Hoặc '0.0.0.0'
    port: 5173,
    allowedHosts: true,
  },
});