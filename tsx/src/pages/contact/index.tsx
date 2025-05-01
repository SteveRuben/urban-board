// components/index.tsx
import React, { useState, ChangeEvent, FormEvent, ReactElement } from 'react';
import { Mail, Phone, MapPin, MessageSquare, Send, CheckCircle } from 'lucide-react';
import { NextPageWithLayout } from '@/types/page';// You may need to create this type
import Layout from '@/components/layout/layout';

interface FormData {
  name: string;
  email: string;
  company: string;
  subject: string;
  message: string;
}

const Contact: NextPageWithLayout = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: ''
  });
  
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    
    try {
      // Simulation d'un appel API avec un délai
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dans une application réelle, vous enverriez les données à votre API
      // const response = await fetch('/api/contact', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(formData)
      // });
      // 
      // if (!response.ok) throw new Error('Erreur lors de l'envoi du formulaire');
      
      setFormSubmitted(true);
      setFormData({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      setFormError('Une erreur est survenue. Veuillez réessayer plus tard.');
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-secondary-700 py-16">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl font-bold text-black mb-4">Contactez-nous</h1>
          <p className="text-xl text-black/90 max-w-2xl mx-auto">
            Des questions sur RecruteIA ? Notre équipe est là pour vous aider. Contactez-nous pour en savoir plus sur notre plateforme.
          </p>
        </div>
      </section>
      
      {/* Contact Info and Form */}
      <section className="py-16">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-12 gap-12">
            {/* Contact Information */}
            <div className="md:col-span-4">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Informations de Contact</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800">Email</h3>
                    <p className="text-gray-600 mt-1">hello@recruteia.com</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800">Téléphone</h3>
                    <p className="text-gray-600 mt-1">+1 4XX-5XX-0XXX</p>
                    <p className="text-gray-600">Lun - Ven, 9h - 18h</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800">Adresse</h3>
                    <p className="text-gray-600 mt-1">
                      123 Avenue de l'Innovation<br />
                      75008 Paris<br />
                      France
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-800 mb-3">Suivez-nous</h3>
                <div className="flex space-x-4">
                  <a href="https://twitter.com/recruteia" className="text-gray-600 hover:text-blue-600" target="_blank" rel="noopener noreferrer">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  
                  <a href="https://linkedin.com/company/recruteia" className="text-gray-600 hover:text-blue-600" target="_blank" rel="noopener noreferrer">
                    <span className="sr-only">LinkedIn</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
            
            {/* Contact Form */}
            <div className="md:col-span-8">
              <div className="bg-white p-8 rounded-lg shadow-md">
                <div className="flex items-center mb-6">
                  <MessageSquare className="h-7 w-7 text-blue-600 mr-3" />
                  <h2 className="text-2xl font-bold text-gray-800">Envoyez-nous un message</h2>
                </div>
                
                {formSubmitted ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">Message envoyé!</h3>
                    <p className="text-gray-600 mb-6">
                      Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
                    </p>
                    <button 
                      onClick={() => setFormSubmitted(false)}
                      className="px-6 py-2 bg-blue-600 text-black font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Envoyer un autre message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                          Nom*
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Votre nom"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                          Email*
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="votre@email.com"
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                          Entreprise
                        </label>
                        <input
                          type="text"
                          id="company"
                          name="company"
                          value={formData.company}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Nom de votre entreprise"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                          Sujet*
                        </label>
                        <select
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Sélectionnez un sujet</option>
                          <option value="demo">Demande de démonstration</option>
                          <option value="pricing">Informations sur les tarifs</option>
                          <option value="support">Support technique</option>
                          <option value="partnership">Partenariat</option>
                          <option value="other">Autre</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                        Message*
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Comment pouvons-nous vous aider?"
                      ></textarea>
                    </div>
                    
                    {formError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600">{formError}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">* Champs obligatoires</p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`inline-flex items-center px-6 py-3 bg-blue-600 text-black font-medium rounded-lg ${
                          isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-blue-700'
                        } transition-colors`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Envoi en cours...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Envoyer
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Map Section */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="rounded-lg overflow-hidden shadow-md h-96">
            {/* Vous pouvez remplacer ceci par une carte Google Maps ou OpenStreetMap */}
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <p className="text-gray-600">Carte interactive ici</p>
              {/* 
                Pour intégrer Google Maps:
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2624.9916256937595!2d2.292292615509614!3d48.85836507928757!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47e66e2964e34e2d%3A0x8ddca9ee380ef7e0!2sTour%20Eiffel!5e0!3m2!1sfr!2sfr!4v1649175929059!5m2!1sfr!2sfr" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              */}
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Questions fréquemment posées</h2>
          <p className="text-lg text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Voici quelques réponses aux questions les plus fréquemment posées sur notre plateforme.
          </p>
          
          <div className="max-w-3xl mx-auto divide-y divide-gray-200">
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">Comment fonctionne le mode autonome d'entretien?</h3>
              <div className="mt-3">
                <p className="text-gray-600">
                  Dans le mode autonome, notre IA conduit l'entretien complet avec le candidat, posant des questions pertinentes, analysant les réponses en temps réel et s'adaptant au candidat. Le recruteur reçoit ensuite un rapport détaillé et peut revoir l'intégralité de l'entretien.
                </p>
              </div>
            </div>
            
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">L'IA peut-elle vraiment évaluer objectivement les compétences techniques?</h3>
              <div className="mt-3">
                <p className="text-gray-600">
                  Oui, notre IA est formée pour évaluer avec précision les compétences techniques dans divers domaines. Elle analyse la pertinence, l'exactitude et la profondeur des réponses. Cependant, nous recommandons toujours une validation finale par un expert humain pour les décisions d'embauche importantes.
                </p>
              </div>
            </div>
            
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">Comment personnaliser les assistants IA pour notre entreprise?</h3>
              <div className="mt-3">
                <p className="text-gray-600">
                  Vous pouvez personnaliser les assistants IA en ajustant leur personnalité, leurs connaissances techniques et leurs capacités d'évaluation. De plus, vous pouvez ajouter des documents spécifiques à votre entreprise pour enrichir leur compréhension de votre culture et de vos exigences.
                </p>
              </div>
            </div>
            
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">RecruteIA s'intègre-t-il avec notre ATS existant?</h3>
              <div className="mt-3">
                <p className="text-gray-600">
                  Oui, RecruteIA s'intègre avec la plupart des systèmes de suivi des candidats (ATS) populaires via notre API. Nous proposons également des intégrations prêtes à l'emploi avec des systèmes comme Workday, Lever, Greenhouse et d'autres.
                </p>
              </div>
            </div>
            
            <div className="py-6">
              <h3 className="text-lg font-medium text-gray-900">Quel support fournissez-vous pendant l'implémentation?</h3>
              <div className="mt-3">
                <p className="text-gray-600">
                  Nous offrons un support complet pendant l'implémentation, y compris la configuration initiale, la formation de votre équipe, et l'assistance technique. Chaque client est assigné à un gestionnaire de compte dédié qui vous guidera tout au long du processus.
                </p>
              </div>
            </div>
          </div>
          
          <div className="text-center mt-8">
            <a href="/faq" className="text-blue-600 font-medium hover:text-blue-800">
              Voir toutes les questions fréquentes
            </a>
          </div>
        </div>
      </section>
      
      {/* Newsletter */}
      <section className="py-16 bg-indigo-700 text-black">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Restez informé</h2>
            <p className="text-lg text-black/90 mb-8">
              Abonnez-vous à notre newsletter pour recevoir les dernières actualités, fonctionnalités et conseils sur le recrutement assisté par IA.
            </p>
            
            <form className="flex flex-col sm:flex-row gap-4 justify-center">
              <input
                type="email"
                placeholder="Votre adresse email"
                className="px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-black placeholder-white/60 flex-grow max-w-md focus:outline-none focus:ring-2 focus:ring-white/50"
                required
              />
              <button type="submit" className="px-6 py-3 bg-white text-indigo-700 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                S'abonner
              </button>
            </form>
            
            <p className="text-sm mt-4 text-black/70">
              Nous respectons votre vie privée. Désabonnez-vous à tout moment.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

Contact.getLayout = (page: ReactElement) => <Layout>{page}</Layout>;
export default Contact;