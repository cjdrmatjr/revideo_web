/* ==========================================================
   RE:VIDEO 디지털 추억 페이지 — 상호작용
   1. 스크롤 등장 애니메이션
   2. 영상 재생 오버레이
   3. 복원 전/후 비교 슬라이더
   4. 사진 라이트박스
   5. 공유 / 링크 복사
   6. 맨 위로 버튼
   ========================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- 1. 스크롤 등장 ---------- */

  var revealItems = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach(function (el) {
      el.classList.add("is-shown");
    });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-shown");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ---------- 2. 영상 재생 오버레이 ---------- */

  var video = document.getElementById("memory-video");
  var playButton = document.getElementById("video-play");

  if (video && playButton) {
    var hideOverlay = function () {
      playButton.hidden = true;
    };

    playButton.addEventListener("click", function () {
      video.play().then(hideOverlay).catch(function () {
        showToast("영상을 재생할 수 없습니다.");
      });
    });

    video.addEventListener("play", hideOverlay);

    video.addEventListener("pause", function () {
      if (video.currentTime === 0) {
        playButton.hidden = false;
      }
    });

    video.addEventListener("ended", function () {
      playButton.hidden = false;
    });
  }

  /* ---------- 3. 복원 전/후 비교 슬라이더 ---------- */

  var compare = document.getElementById("compare");
  var compareRange = document.getElementById("compare-range");

  if (compare && compareRange) {
    var updateCompare = function () {
      compare.style.setProperty("--pos", compareRange.value + "%");
    };

    compareRange.addEventListener("input", updateCompare);
    updateCompare();
  }

  /* ---------- 4. 사진 라이트박스 ---------- */

  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightbox-img");
  var lightboxCaption = document.getElementById("lightbox-caption");
  var galleryItems = Array.prototype.slice.call(
    document.querySelectorAll(".gallery__item")
  );
  var currentIndex = 0;
  var lastFocused = null;

  var renderLightbox = function () {
    var item = galleryItems[currentIndex];
    if (!item) return;
    lightboxImg.src = item.getAttribute("data-full") || "";
    lightboxImg.alt = item.querySelector("img").alt;
    lightboxCaption.textContent = item.getAttribute("data-caption") || "";
  };

  var openLightbox = function (index) {
    currentIndex = index;
    lastFocused = document.activeElement;
    renderLightbox();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    document.getElementById("lightbox-next").focus();
  };

  var closeLightbox = function () {
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
  };

  var stepLightbox = function (delta) {
    currentIndex =
      (currentIndex + delta + galleryItems.length) % galleryItems.length;
    renderLightbox();
  };

  if (lightbox && galleryItems.length > 0) {
    galleryItems.forEach(function (item, index) {
      item.addEventListener("click", function () {
        openLightbox(index);
      });
    });

    lightbox.addEventListener("click", function (event) {
      if (event.target.hasAttribute("data-lightbox-close")) {
        closeLightbox();
      }
    });

    document.getElementById("lightbox-prev").addEventListener("click", function () {
      stepLightbox(-1);
    });

    document.getElementById("lightbox-next").addEventListener("click", function () {
      stepLightbox(1);
    });

    document.addEventListener("keydown", function (event) {
      if (lightbox.hidden) return;

      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowLeft") stepLightbox(-1);
      if (event.key === "ArrowRight") stepLightbox(1);
    });
  }

  /* ---------- 5. 공유 / 링크 복사 ---------- */

  var shareButton = document.getElementById("share-btn");
  var copyButton = document.getElementById("copy-btn");

  var pageUrl = window.location.href;
  var shareData = {
    title: document.title,
    text: "NFC 키링으로 여는 디지털 추억 페이지",
    url: pageUrl,
  };

  var copyLink = function () {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(pageUrl);
    }

    return new Promise(function (resolve, reject) {
      var input = document.createElement("input");
      input.value = pageUrl;
      document.body.appendChild(input);
      input.select();

      try {
        document.execCommand("copy");
        resolve();
      } catch (error) {
        reject(error);
      } finally {
        document.body.removeChild(input);
      }
    });
  };

  if (shareButton) {
    shareButton.addEventListener("click", function () {
      if (navigator.share) {
        navigator.share(shareData).catch(function () {
          /* 사용자가 공유를 취소한 경우 무시 */
        });
      } else {
        copyLink()
          .then(function () {
            showToast("링크를 복사했습니다.");
          })
          .catch(function () {
            showToast("링크 복사를 실패했습니다.");
          });
      }
    });
  }

  if (copyButton) {
    copyButton.addEventListener("click", function () {
      copyLink()
        .then(function () {
          showToast("링크를 복사했습니다.");
        })
        .catch(function () {
          showToast("링크 복사를 실패했습니다.");
        });
    });
  }

  /* ---------- 6. 맨 위로 버튼 ---------- */

  var toTopButton = document.getElementById("to-top");

  if (toTopButton) {
    var toggleToTop = function () {
      toTopButton.classList.toggle("is-visible", window.scrollY > 600);
    };

    window.addEventListener("scroll", toggleToTop, { passive: true });
    toggleToTop();

    toTopButton.addEventListener("click", function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }

  /* ---------- 토스트 ---------- */

  var toast = document.getElementById("toast");
  var toastTimer = null;

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("is-visible");

    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2200);
  }
})();
