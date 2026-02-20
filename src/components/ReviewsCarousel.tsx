import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react";

interface Review {
  id: number;
  name: string;
  role: string;
  company: string;
  rating: number;
  comment: string;
  avatar?: string;
}

const reviews: Review[] = [
  {
    id: 1,
    name: "Maria Silva",
    role: "Arquiteta",
    company: "Studio Arquitetura",
    rating: 5,
    comment: "O Calcularq transformou completamente minha forma de precificar projetos. Agora tenho confiança total nos valores que apresento aos clientes. A ferramenta é intuitiva e os resultados são precisos."
  },
  {
    id: 2,
    name: "João Santos",
    role: "Arquiteto",
    company: "Santos Arquitetos Associados",
    rating: 5,
    comment: "Excelente ferramenta! Os fatores de complexidade são muito bem pensados e me ajudam a justificar o valor dos meus projetos. Recomendo para todos os profissionais da área."
  },
  {
    id: 3,
    name: "Ana Costa",
    role: "Arquiteta e Urbanista",
    company: "Costa Arquitetura",
    rating: 5,
    comment: "Finalmente uma calculadora que entende a realidade dos projetos de arquitetura. A possibilidade de ajustar os pesos dos fatores é essencial. Estou muito satisfeita!"
  },
  {
    id: 4,
    name: "Carlos Mendes",
    role: "Arquiteto",
    company: "Mendes & Associados",
    rating: 5,
    comment: "Uso o Calcularq há alguns meses e já se tornou indispensável no meu fluxo de trabalho. A interface é limpa, os cálculos são rápidos e os resultados são confiáveis."
  }
];

export default function ReviewsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    if (newDirection === 1) {
      setCurrentIndex((prev) => (prev + 1) % reviews.length);
    } else {
      setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-gradient-to-br from-slate-50 to-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          O que nossos clientes dizem
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Depoimentos de profissionais que confiam no Calcularq
        </p>
      </motion.div>

      <div className="relative max-w-4xl mx-auto">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-slate-200 min-h-[450px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(_, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  paginate(1);
                } else if (swipe > swipeConfidenceThreshold) {
                  paginate(-1);
                }
              }}
              className="absolute inset-0 flex items-center"
            >
              <div className="w-full px-8 md:px-12 py-10">
                <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
                  <Quote className="w-10 h-10 text-slate-300 mb-5 flex-shrink-0" />
                  
                  <div className="flex gap-1 mb-6 justify-center">
                    {[...Array(reviews[currentIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 flex-shrink-0" />
                    ))}
                  </div>

                  <p className="text-base md:text-lg text-slate-700 mb-8 leading-relaxed px-2 break-words">
                    "{reviews[currentIndex].comment}"
                  </p>

                  <div className="flex flex-col items-center mt-auto">
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-3 flex-shrink-0">
                      <span className="text-xl md:text-2xl font-bold text-slate-600">
                        {reviews[currentIndex].name.charAt(0)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 text-base md:text-lg mb-1">
                      {reviews[currentIndex].name}
                    </h4>
                    <p className="text-slate-500 text-sm text-center">
                      {reviews[currentIndex].role} • {reviews[currentIndex].company}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          
          {/* Placeholder para manter altura fixa */}
          <div className="invisible flex items-center w-full px-8 md:px-12 py-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto w-full">
              <Quote className="w-10 h-10 text-slate-300 mb-5 flex-shrink-0" />
              <div className="flex gap-1 mb-6 justify-center">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400 flex-shrink-0" />
                ))}
              </div>
              <p className="text-base md:text-lg text-slate-700 mb-8 leading-relaxed px-2 break-words">
                "Placeholder text to maintain consistent height and proper formatting across all cards in the carousel component"
              </p>
              <div className="flex flex-col items-center mt-auto">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center mb-3 flex-shrink-0">
                  <span className="text-xl md:text-2xl font-bold text-slate-600">P</span>
                </div>
                <h4 className="font-semibold text-slate-900 text-base md:text-lg mb-1">Placeholder Name</h4>
                <p className="text-slate-500 text-sm text-center">Role • Company Name</p>
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={() => paginate(-1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
            aria-label="Review anterior"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <button
            onClick={() => paginate(1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors z-10"
            aria-label="Próximo review"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="flex justify-center gap-2 mt-8">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`
                w-2 h-2 rounded-full transition-all duration-300
                ${index === currentIndex 
                  ? "w-8 bg-slate-900" 
                  : "bg-slate-300 hover:bg-slate-400"
                }
              `}
              aria-label={`Ir para review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}




