import { getSiteContentMap } from '@/lib/db/site-content';
import ContactForm from '@/components/public/ContactForm';

export const metadata = { title: 'Contact Us — AgriOxen Monthly' };
export const dynamic = 'force-dynamic';

export default async function ContactPage() {
  const content = await getSiteContentMap();

  return (
    <div className="section-padding" style={{ paddingTop: 150 }}>
      <div className="container">
        <div className="row">
          <div className="col-lg-6 col-12 mb-5 mb-lg-0">
            <div className="eyebrow">Get in Touch</div>
            <h1 className="mb-4">Contact Us</h1>
            <ContactForm />
          </div>
          <div className="col-lg-5 col-12 ms-lg-auto">
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-envelope"></i>
              </div>
              <div>
                <h5>Editorial Desk</h5>
                <p>
                  <a href={`mailto:${content.contact_email || 'editor@agrioxenmonthly.com'}`} className="text-primary-custom">
                    {content.contact_email || 'editor@agrioxenmonthly.com'}
                  </a>
                </p>
              </div>
            </div>
            <div className="feature-item">
              <div className="feature-icon">
                <i className="bi bi-telephone"></i>
              </div>
              <div>
                <h5>Reader Support</h5>
                <p>{content.contact_phone || '+91 80 4567 8900 · Mon–Fri, 9am–6pm IST'}</p>
              </div>
            </div>
            <div className="feature-item mb-0">
              <div className="feature-icon">
                <i className="bi bi-geo-alt"></i>
              </div>
              <div>
                <h5>Head Office</h5>
                <p className="mb-0">{content.contact_address || 'Bengaluru, Karnataka, India'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
