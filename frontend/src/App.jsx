import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BlogEditor from './features/editor/components/BlogEditor'
import DocsPage from './pages/docs/DocsPage'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <main className="app-root">
              <BlogEditor />
            </main>
          }
        />
        <Route path="/docs" element={<DocsPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
