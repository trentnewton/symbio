<footer id="footer">
  <div class="row">
    <div class="column">
      <svg class="footer-logo" aria-labelledby="silhouette-logo" preserveAspectRatio="xMinYMin meet" viewBox="0 0 356 354"><use xlink:href="#silhouette-logo"/></svg>
      <?php if ($page['copyright']): ?>
        <p class="copyright"><?php print render($page['copyright']); ?></p>
      <?php endif; ?>
      <?php if ($page['footer']): ?>
        <p class="copyright"><?php print render($page['footer']); ?></p>
      <?php endif; ?>
    </div>
  </div>
</footer>