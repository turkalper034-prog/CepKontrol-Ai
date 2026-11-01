Feature: CepKontrol AI API Health Check
  Scenario: API saglik kontrolü basarili olmali
    Given CepKontrol AI API adresi hazır
    When Kullanıcı API saglik kontrolü endpoint'ine GET isteği gönderir
    Then API saglik kontrolü başarılı olmalı ve HTTP 200 döndürmeli
    And API saglik durumu "sağlıklı" olmalidir
