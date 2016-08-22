<footer class="footer" itemscope itemtype="http://schema.org/WPFooter">
  <div class="row column">
    <a class="footer-logo-link" href="<?php print render($front_page); ?>" title="<?php print t('Home'); ?>" rel="home">
      <svg class="footer-logo" aria-labelledby="silhouette-symbio-logo" preserveAspectRatio="xMinYMin meet"><use xlink:href="#silhouette-symbio-logo"/></svg>
    </a>
    <div class="copyright">
    <?php if ($page['footer_copyright']){ ?>
 		<?php print render($page['footer_copyright']); ?>
 	<?php } else { ?>
 		<?php print t('Copyright'); ?> &copy; <?php echo date("Y"); ?> <?php print $site_name ?>
    <?php } ?>
    </div>
    <?php if ($page['footer_menu']): ?>
    <?php print render($page['footer_menu']); ?>
    <?php endif; ?>
  </div>
</footer>