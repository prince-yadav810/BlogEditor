import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
    return (
        <footer className="site-footer">
            <span>Built by Prince Yadav</span>
            <span className="footer-sep">·</span>
            <a href="mailto:princeyadav810py@gmail.com" className="footer-link">
                princeyadav810py@gmail.com
            </a>
            <span className="footer-sep">·</span>
            <span>Internship Assignment for Neugence</span>
            <span className="footer-sep">·</span>
            <Link to="/docs" className="footer-link footer-docs-link">
                Read the Docs →
            </Link>
        </footer>
    )
}
