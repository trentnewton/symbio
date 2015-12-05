<footer id="footer" itemscope itemtype="http://schema.org/WPFooter">
  <div class="row">
    <div class="column">
      <a href="<?php print render($front_page); ?>" title="<?php print t('Home'); ?>">
        <svg class="footer-logo" aria-labelledby="silhouette-logo" preserveAspectRatio="xMinYMin meet" viewBox="0 0 356 354"><use xlink:href="#silhouette-logo"/></svg>
      </a>
      <?php if ($page['copyright']): ?>
      <p class="copyright"><?php print render($page['copyright']); ?></p>
      <?php endif; ?>
      <?php if ($page['footer']): ?>
      <?php print render($page['footer']); ?>
      <?php endif; ?>
    </div>
  </div>
</footer>